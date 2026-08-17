<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\SecurityAudit;
use App\Models\User;
use App\Notifications\AppointmentConfirmed;
use App\Notifications\AppointmentAssigned;
use App\Notifications\AppointmentRejected;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AppointmentApprovalService
{
    public const REJECTION_REASONS = [
        'doctor_unavailable',
        'schedule_adjustment',
        'clinic_unavailable',
        'incomplete_requirements',
        'duplicate_appointment',
        'other',
    ];

    public function accept(Appointment $appointment, User $admin): Appointment
    {
        return DB::transaction(function () use ($appointment, $admin): Appointment {
            $locked = Appointment::query()->lockForUpdate()->findOrFail($appointment->id);
            $this->assertPendingIndividual($locked);
            $locked->loadMissing('user.patientProfile');

            if (! $locked->user?->patientProfile?->birthdate || ! $locked->user->patientProfile->sex || ! $locked->user->contact) {
                throw ValidationException::withMessages(['profile' => 'The patient profile is incomplete.']);
            }
            if ($locked->doctor_id === null || $locked->start_time === null || $locked->end_time === null) {
                throw ValidationException::withMessages(['appointment' => 'The appointment schedule is incomplete.']);
            }

            $scheduledAt = Carbon::parse($locked->appointment_date->toDateString().' '.$locked->start_time->format('H:i:s'));
            if ($scheduledAt->isPast()) {
                throw ValidationException::withMessages(['appointment' => 'A past appointment time cannot be accepted.']);
            }

            $doctor = User::query()->whereKey($locked->doctor_id)->lockForUpdate()->first();
            if ($doctor === null || $doctor->role !== 'doctor' || ! $doctor->is_active) {
                throw ValidationException::withMessages(['doctor_id' => 'The selected doctor is no longer available.']);
            }

            $day = strtolower($locked->appointment_date->format('D'));
            $start = $locked->start_time->format('H:i');
            $end = $locked->end_time->format('H:i');
            $withinAvailability = collect($doctor->availability ?? [])->where('day', $day)
                ->contains(fn ($period) => $start >= $period['start'] && $end <= $period['end']);
            if (! $withinAvailability) {
                throw ValidationException::withMessages(['start_time' => 'The selected time is no longer within the doctor\'s availability.']);
            }

            $conflict = Appointment::query()
                ->where('id', '!=', $locked->id)
                ->where('doctor_id', $doctor->id)
                ->whereDate('appointment_date', $locked->appointment_date)
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->where('start_time', '<', $end)
                ->where('end_time', '>', $start)
                ->lockForUpdate()
                ->exists();
            if ($conflict) {
                throw ValidationException::withMessages(['start_time' => 'The selected time slot is no longer available.']);
            }

            $locked->update([
                'status' => 'accepted',
                'processed_by' => $admin->id,
                'processed_at' => now(),
                'rejection_reason' => null,
                'rejection_details' => null,
            ]);
            $this->audit($locked, $admin, 'pending', 'accepted');
            DB::afterCommit(function () use ($locked): void {
                $confirmed = $locked->fresh(['doctor', 'user']);
                try {
                    $confirmed->user?->notify(new AppointmentConfirmed($confirmed));
                } catch (\Throwable $exception) {
                    Log::warning('Patient appointment confirmation notification failed.', [
                        'appointment_id' => $confirmed->id,
                        'exception' => $exception->getMessage(),
                    ]);
                }
                try {
                    $confirmed->doctor?->notify(new AppointmentAssigned($confirmed));
                } catch (\Throwable $exception) {
                    Log::warning('Doctor appointment assignment notification failed.', [
                        'appointment_id' => $confirmed->id,
                        'exception' => $exception->getMessage(),
                    ]);
                }
            });

            return $locked->refresh();
        }, 3);
    }

    public function reject(Appointment $appointment, User $admin, string $reason, ?string $details): Appointment
    {
        return DB::transaction(function () use ($appointment, $admin, $reason, $details): Appointment {
            $locked = Appointment::query()->lockForUpdate()->findOrFail($appointment->id);
            $this->assertPendingIndividual($locked);
            $locked->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'rejection_details' => filled($details) ? trim($details) : null,
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ]);
            $this->audit($locked, $admin, 'pending', 'rejected');
            DB::afterCommit(function () use ($locked): void {
                try {
                    $locked->user?->notify(new AppointmentRejected($locked->fresh()));
                } catch (\Throwable $exception) {
                    Log::warning('Patient appointment rejection notification failed.', [
                        'appointment_id' => $locked->id,
                        'exception' => $exception->getMessage(),
                    ]);
                }
            });

            return $locked->refresh();
        }, 3);
    }

    private function assertPendingIndividual(Appointment $appointment): void
    {
        if ($appointment->type !== 'individual') {
            throw ValidationException::withMessages(['appointment' => 'Only individual online requests use this approval workflow.']);
        }
        if ($appointment->status !== 'pending') {
            throw ValidationException::withMessages(['appointment' => 'This appointment has already been processed.']);
        }
    }

    private function audit(Appointment $appointment, User $admin, string $from, string $to): void
    {
        SecurityAudit::create([
            'actor_id' => $admin->id,
            'target_user_id' => $appointment->user_id,
            'action' => 'appointment_'.$to,
            'status' => 'success',
            'metadata' => [
                'appointment_id' => $appointment->id,
                'previous_status' => $from,
                'new_status' => $to,
                'processed_at' => $appointment->processed_at?->toIso8601String(),
                'rejection_reason' => $appointment->rejection_reason,
            ],
        ]);
    }
}
