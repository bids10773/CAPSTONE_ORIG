<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class WalkInDoctorSlotService
{
    public function __construct(private readonly OnsiteStaffAvailabilityService $onsiteAvailability) {}

    /** @return array<int, array{id:int, name:string, slots:array<int, string>}> */
    public function availableDoctors(?CarbonInterface $at = null): array
    {
        $at ??= now();

        return User::query()->where('role', 'doctor')->where('is_active', true)
            ->orderBy('last_name')->orderBy('first_name')->get()
            ->map(fn (User $doctor): array => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'slots' => $this->availableSlots($doctor, $at),
            ])
            ->filter(fn (array $doctor): bool => $doctor['slots'] !== [])
            ->values()->all();
    }

    /** @return array<int, string> */
    public function availableSlots(User $doctor, ?CarbonInterface $at = null): array
    {
        $at ??= now();
        if ($doctor->role !== 'doctor' || ! $doctor->is_active || $at->isWeekend()) {
            return [];
        }

        $date = $at->format('Y-m-d');
        $day = strtolower($at->format('D'));
        $duration = (int) config('medical.clinic_hours.slot_minutes', 30);
        $bookings = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $date)
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->whereNotNull('start_time')->whereNotNull('end_time')
            ->get(['start_time', 'end_time']);

        $slots = [];
        foreach (($doctor->availability ?? []) as $period) {
            if (($period['day'] ?? null) !== $day || ! isset($period['start'], $period['end'])) {
                continue;
            }
            $cursor = Carbon::parse($date.' '.$period['start']);
            $end = Carbon::parse($date.' '.$period['end']);
            while ($cursor->copy()->addMinutes($duration)->lessThanOrEqualTo($end)) {
                $slotEnd = $cursor->copy()->addMinutes($duration);
                $startTime = $cursor->format('H:i');
                $endTime = $slotEnd->format('H:i');
                $overlap = $bookings->contains(fn (Appointment $booking): bool => $booking->start_time->format('H:i') < $endTime
                    && $booking->end_time->format('H:i') > $startTime);

                if ($cursor->greaterThan($at) && ! $overlap
                    && ! $this->onsiteAvailability->doctorHasOnsiteConflict($doctor->id, $date, $startTime, $endTime)) {
                    $slots[] = $startTime;
                }
                $cursor->addMinutes($duration);
            }
        }

        return array_values(array_unique($slots));
    }

    public function assertAvailable(User $doctor, string $startTime): void
    {
        if (! in_array($startTime, $this->availableSlots($doctor), true)) {
            throw ValidationException::withMessages([
                'start_time' => 'This doctor and time are no longer available. Choose another free slot or leave the patient waiting.',
            ]);
        }
    }
}
