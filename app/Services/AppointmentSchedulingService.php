<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\SecurityAudit;
use App\Models\User;
use App\Notifications\AppointmentAutoCancelled;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentSchedulingService
{
    public const GRACE_PERIOD_MINUTES = 10;

    public function scheduledAt(Appointment $appointment): ?Carbon
    {
        if ($appointment->start_time === null) {
            return null;
        }

        return Carbon::parse($appointment->appointment_date->format('Y-m-d').' '.$appointment->start_time->format('H:i:s'));
    }

    public function graceEndsAt(Appointment $appointment): ?Carbon
    {
        return $this->scheduledAt($appointment)?->addMinutes(self::GRACE_PERIOD_MINUTES);
    }

    public function checkIn(Appointment $appointment, User $staff, ?CarbonInterface $at = null): Appointment
    {
        $at = Carbon::instance(($at ?? now())->toDateTime());
        $wasLate = DB::transaction(function () use ($appointment, $staff, $at): bool {
            $locked = Appointment::query()->lockForUpdate()->findOrFail($appointment->id);

            if ($locked->auto_cancelled_at !== null || $locked->replacementWalkIn()->exists()) {
                return true;
            }

            if ($this->shouldExpire($locked, $at)) {
                $this->cancelAndRelease($locked, $at);

                return true;
            }

            $locked->update([
                'arrived_at' => $locked->arrived_at ?? $at,
                'checked_in_by' => $staff->id,
                'status' => 'arrived',
            ]);

            SecurityAudit::create([
                'actor_id' => $staff->id,
                'target_user_id' => $locked->user_id,
                'action' => 'appointment_checked_in',
                'status' => 'success',
                'metadata' => [
                    'appointment_id' => $locked->id,
                    'arrived_at' => $at->toIso8601String(),
                ],
            ]);

            return false;
        });

        if ($wasLate) {
            throw ValidationException::withMessages([
                'status' => 'The grace period has ended and this slot has been released. Please ask the receptionist for the next available schedule.',
            ]);
        }

        return $appointment->refresh();
    }

    public function expireLateAppointments(?CarbonInterface $at = null): int
    {
        $at = Carbon::instance(($at ?? now())->toDateTime());
        $ids = Appointment::query()
            ->whereIn('type', ['individual', 'company_referral'])
            ->whereIn('status', ['pending', 'accepted'])
            ->whereNull('arrived_at')
            ->whereNotNull('start_time')
            ->whereDate('appointment_date', '<=', $at->toDateString())
            ->pluck('id');

        $expired = 0;
        foreach ($ids as $id) {
            $didExpire = DB::transaction(function () use ($id, $at): bool {
                $appointment = Appointment::query()->lockForUpdate()->find($id);
                if ($appointment === null || ! $this->shouldExpire($appointment, $at)) {
                    return false;
                }

                $this->cancelAndRelease($appointment, $at);

                return true;
            });
            $expired += (int) $didExpire;
        }

        return $expired;
    }

    public function arrivalStatus(Appointment $appointment, ?CarbonInterface $at = null): string
    {
        if ($appointment->auto_cancelled_at !== null) {
            return 'auto_cancelled';
        }
        if ($appointment->arrived_at !== null) {
            return 'arrived';
        }
        if ($appointment->type === 'walk_in') {
            return $appointment->released_from_appointment_id ? 'assigned_released_slot' : 'waiting';
        }

        $graceEndsAt = $this->graceEndsAt($appointment);
        if ($graceEndsAt !== null && ($at ?? now())->lessThanOrEqualTo($graceEndsAt)) {
            return 'within_grace';
        }

        return 'late';
    }

    private function shouldExpire(Appointment $appointment, CarbonInterface $at): bool
    {
        $graceEndsAt = $this->graceEndsAt($appointment);

        return in_array($appointment->type, ['individual', 'company_referral'], true)
            && in_array($appointment->status, ['pending', 'accepted'], true)
            && $appointment->arrived_at === null
            && $appointment->auto_cancelled_at === null
            && $graceEndsAt !== null
            && $at->greaterThan($graceEndsAt);
    }

    private function cancelAndRelease(Appointment $appointment, CarbonInterface $at): void
    {
        $reason = 'Automatically cancelled after the 10-minute arrival grace period.';
        $appointment->update([
            'status' => 'cancelled',
            'auto_cancelled_at' => $at,
            'cancellation_reason' => $reason,
        ]);

        $walkIn = Appointment::query()
            ->where('type', 'walk_in')
            ->whereDate('appointment_date', $appointment->appointment_date)
            ->whereIn('status', ['pending', 'arrived'])
            ->whereNotNull('arrived_at')
            ->whereNull('released_from_appointment_id')
            ->orderBy('arrived_at')
            ->orderBy('id')
            ->lockForUpdate()
            ->first();

        if ($walkIn !== null) {
            $walkIn->update([
                'start_time' => $appointment->start_time,
                'end_time' => $appointment->end_time,
                'released_from_appointment_id' => $appointment->id,
                'released_slot_assigned_at' => $at,
            ]);
        }

        SecurityAudit::create([
            'actor_id' => null,
            'target_user_id' => $appointment->user_id,
            'action' => 'appointment_auto_cancelled',
            'status' => 'success',
            'metadata' => [
                'appointment_id' => $appointment->id,
                'replacement_walk_in_id' => $walkIn?->id,
                'reason' => $reason,
            ],
        ]);

        if ($walkIn !== null) {
            SecurityAudit::create([
                'actor_id' => null,
                'target_user_id' => $walkIn->user_id,
                'action' => 'released_slot_assigned',
                'status' => 'success',
                'metadata' => [
                    'appointment_id' => $walkIn->id,
                    'released_from_appointment_id' => $appointment->id,
                    'assigned_at' => $at->toIso8601String(),
                ],
            ]);
        }

        DB::afterCommit(function () use ($appointment): void {
            $appointment->user?->notify(new AppointmentAutoCancelled($appointment));
        });
    }
}
