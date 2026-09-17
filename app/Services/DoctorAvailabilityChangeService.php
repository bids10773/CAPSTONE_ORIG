<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\DoctorAvailabilityChangeRequest;
use App\Models\User;
use App\Notifications\DoctorAvailabilityChangeRequested;
use App\Notifications\DoctorScheduleChanged;
use App\Notifications\DoctorScheduleChangePending;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class DoctorAvailabilityChangeService
{
    public function __construct(private readonly OnsiteStaffAvailabilityService $onsiteAvailability) {}

    public function submit(User $doctor, array $requestedAvailability): DoctorAvailabilityChangeRequest
    {
        $changeRequest = DB::transaction(function () use ($doctor, $requestedAvailability) {
            $lockedDoctor = User::query()->lockForUpdate()->findOrFail($doctor->id);

            if (DoctorAvailabilityChangeRequest::query()->pending()->where('doctor_id', $lockedDoctor->id)->exists()) {
                throw ValidationException::withMessages([
                    'availability' => 'You already have an availability change waiting for administrator review.',
                ]);
            }

            return DoctorAvailabilityChangeRequest::create([
                'doctor_id' => $lockedDoctor->id,
                'current_availability' => $lockedDoctor->availability ?? [],
                'requested_availability' => $requestedAvailability,
                'status' => 'pending',
            ])->load('doctor');
        }, 3);

        $affected = $this->affectedAppointments($doctor, collect($requestedAvailability));
        $admins = User::query()->where('role', 'admin')->where('is_active', true)->get();

        $this->notifySafely(
            fn () => Notification::send($admins, new DoctorAvailabilityChangeRequested($changeRequest)),
            'Admin availability change notification failed.',
            $changeRequest,
        );

        foreach ($affected as $appointment) {
            if ($appointment->user !== null) {
                $this->notifySafely(
                    fn () => $appointment->user->notify(new DoctorScheduleChangePending($changeRequest, $appointment)),
                    'Patient pending schedule notification failed.',
                    $changeRequest,
                    $appointment,
                );
            }
        }

        return $changeRequest;
    }

    /** @return EloquentCollection<int, Appointment> */
    public function affectedAppointments(User $doctor, Collection $periods, bool $lockForUpdate = false): EloquentCollection
    {
        $appointments = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->whereIn('type', ['individual', 'company_referral'])
            ->whereDate('appointment_date', '>=', today())
            ->whereIn('status', ['pending', 'accepted'])
            ->whereNotNull('start_time')
            ->whereNotNull('end_time')
            ->with('user:id,first_name,middle_name,last_name,email')
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->when($lockForUpdate, fn ($query) => $query->lockForUpdate())
            ->get();

        return $appointments
            ->filter(fn (Appointment $appointment) => ! $this->isWithinAvailability($appointment, $periods))
            ->values();
    }

    public function approve(DoctorAvailabilityChangeRequest $changeRequest, User $admin): int
    {
        $moved = DB::transaction(function () use ($changeRequest, $admin): int {
            $lockedRequest = DoctorAvailabilityChangeRequest::query()
                ->with('doctor')
                ->lockForUpdate()
                ->findOrFail($changeRequest->id);
            $this->assertPending($lockedRequest);

            $doctor = User::query()->lockForUpdate()->findOrFail($lockedRequest->doctor_id);
            $periods = collect($lockedRequest->requested_availability);
            $affected = $this->affectedAppointments($doctor, $periods, true);

            $doctor->update(['availability' => $periods->values()->all()]);

            foreach ($affected as $appointment) {
                $slot = $this->nextAvailableSlot($doctor, $appointment, $periods);
                if ($slot === null) {
                    throw ValidationException::withMessages([
                        'request' => "No valid replacement slot was found for {$appointment->user?->name} within the clinic's 30-day scheduling window.",
                    ]);
                }

                $appointment->update($slot);
            }

            $lockedRequest->update([
                'status' => 'accepted',
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ]);

            return $affected->count();
        }, 3);

        $accepted = $changeRequest->fresh(['doctor']);
        $receptionists = User::query()->where('role', 'receptionist')->where('is_active', true)->get();
        $this->notifySafely(
            fn () => Notification::send($receptionists, new DoctorScheduleChanged($accepted, $moved)),
            'Receptionist doctor schedule notification failed.',
            $accepted,
        );

        return $moved;
    }

    public function reject(DoctorAvailabilityChangeRequest $changeRequest, User $admin): void
    {
        DB::transaction(function () use ($changeRequest, $admin): void {
            $lockedRequest = DoctorAvailabilityChangeRequest::query()->lockForUpdate()->findOrFail($changeRequest->id);
            $this->assertPending($lockedRequest);
            $lockedRequest->update([
                'status' => 'rejected',
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ]);
        }, 3);
    }

    private function isWithinAvailability(Appointment $appointment, Collection $periods): bool
    {
        $day = strtolower($appointment->appointment_date->format('D'));
        $start = $appointment->start_time->format('H:i');
        $end = $appointment->end_time->format('H:i');

        return $periods->where('day', $day)
            ->contains(fn (array $period) => $start >= $period['start'] && $end <= $period['end']);
    }

    /** @return array{appointment_date: string, start_time: string, end_time: string}|null */
    private function nextAvailableSlot(User $doctor, Appointment $appointment, Collection $periods): ?array
    {
        $slotMinutes = (int) config('medical.clinic_hours.slot_minutes', 30);
        $duration = max(
            $slotMinutes,
            $appointment->start_time->diffInMinutes($appointment->end_time),
        );
        $firstDate = Carbon::parse($appointment->appointment_date->toDateString())->startOfDay();
        if ($firstDate->isBefore(today())) {
            $firstDate = Carbon::today();
        }
        $lastDate = Carbon::today()->addDays(29);

        for ($date = $firstDate->copy(); $date->lte($lastDate); $date->addDay()) {
            $day = strtolower($date->format('D'));
            foreach ($periods->where('day', $day)->sortBy('start') as $period) {
                $candidate = Carbon::parse($date->toDateString().' '.$period['start']);
                $periodEnd = Carbon::parse($date->toDateString().' '.$period['end']);

                while ($candidate->copy()->addMinutes($duration)->lte($periodEnd)) {
                    $candidateEnd = $candidate->copy()->addMinutes($duration);
                    $start = $candidate->format('H:i');
                    $end = $candidateEnd->format('H:i');

                    if ($candidate->isFuture()
                        && ! $this->hasClinicConflict($doctor, $appointment, $date, $start, $end)
                        && ! $this->onsiteAvailability->doctorHasOnsiteConflict($doctor->id, $date, $start, $end, true)) {
                        return [
                            'appointment_date' => $date->toDateString(),
                            'start_time' => $start,
                            'end_time' => $end,
                        ];
                    }

                    $candidate->addMinutes($slotMinutes);
                }
            }
        }

        return null;
    }

    private function hasClinicConflict(User $doctor, Appointment $appointment, Carbon $date, string $start, string $end): bool
    {
        return Appointment::query()
            ->whereKeyNot($appointment->id)
            ->where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $date)
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start)
            ->lockForUpdate()
            ->exists();
    }

    private function assertPending(DoctorAvailabilityChangeRequest $changeRequest): void
    {
        if ($changeRequest->status !== 'pending') {
            throw ValidationException::withMessages(['request' => 'This availability change request has already been reviewed.']);
        }
    }

    private function notifySafely(
        callable $callback,
        string $message,
        DoctorAvailabilityChangeRequest $changeRequest,
        ?Appointment $appointment = null,
    ): void {
        try {
            $callback();
        } catch (\Throwable $exception) {
            Log::warning($message, [
                'availability_change_request_id' => $changeRequest->id,
                'appointment_id' => $appointment?->id,
                'exception' => $exception->getMessage(),
            ]);
        }
    }
}
