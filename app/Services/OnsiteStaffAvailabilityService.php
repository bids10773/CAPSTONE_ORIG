<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\OnsiteEventStaff;
use App\Models\User;

class OnsiteStaffAvailabilityService
{
    public function doctorHasOnsiteConflict(
        int $doctorId,
        mixed $date,
        string $start,
        string $end,
        bool $lockForUpdate = false,
    ): bool {
        return Appointment::query()
            ->bulkParents()
            ->whereDate('appointment_date', '<=', $date)
            ->where(function ($range) use ($date): void {
                $range->whereDate('event_end_date', '>=', $date)
                    ->orWhere(function ($legacy) use ($date): void {
                        $legacy->whereNull('event_end_date')
                            ->whereDate('appointment_date', $date);
                    });
            })
            ->whereNotIn('status', ['cancelled', 'rejected', 'completed'])
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start)
            ->whereHas('onsiteStaff', fn ($query) => $query
                ->where('user_id', $doctorId)
                ->where('service_role', 'doctor')
                ->where('is_active', true))
            ->when($lockForUpdate, fn ($query) => $query->lockForUpdate())
            ->exists();
    }

    public function conflictReason(Appointment $event, User $staff): ?string
    {
        if (! $event->start_time || ! $event->end_time) {
            return 'Confirm the event start and end time before assigning staff.';
        }
        $start = $event->start_time->format('H:i');
        $end = $event->end_time->format('H:i');
        $eventStartDate = $event->appointment_date->toDateString();
        $eventEndDate = ($event->event_end_date ?? $event->appointment_date)->toDateString();
        $overlappingEvent = OnsiteEventStaff::query()->where('user_id', $staff->id)->where('is_active', true)
            ->where('bulk_appointment_id', '!=', $event->id)
            ->whereHas('bulkAppointment', fn ($query) => $query
                ->whereDate('appointment_date', '<=', $eventEndDate)
                ->where(function ($range) use ($eventStartDate): void {
                    $range->whereDate('event_end_date', '>=', $eventStartDate)
                        ->orWhere(function ($legacy) use ($eventStartDate): void {
                            $legacy->whereNull('event_end_date')
                                ->whereDate('appointment_date', '>=', $eventStartDate);
                        });
                })
                ->whereNotIn('status', ['cancelled', 'completed'])
                ->where('start_time', '<', $end)
                ->where('end_time', '>', $start))->exists();
        if ($overlappingEvent) {
            return 'This staff member has an overlapping onsite assignment.';
        }
        if ($staff->role !== 'doctor') {
            return null;
        }
        $availability = collect($staff->availability ?? []);
        $date = $event->appointment_date->copy()->startOfDay();
        $lastDate = ($event->event_end_date ?? $event->appointment_date)->copy()->startOfDay();

        while ($date->lte($lastDate)) {
            if ($date->isWeekend()) {
                $date = $date->addDay();

                continue;
            }

            $day = strtolower($date->format('D'));
            if ($availability->isNotEmpty() && ! $availability->where('day', $day)->contains(fn ($period) => $start >= $period['start'] && $end <= $period['end'])) {
                return 'This event is outside the doctor\'s recorded availability on '.$date->format('F j, Y').'.';
            }
            $clinicConflict = Appointment::query()->where('doctor_id', $staff->id)->whereDate('appointment_date', $date)
                ->whereNotIn('status', ['cancelled', 'rejected', 'completed'])->where('start_time', '<', $end)->where('end_time', '>', $start)->exists();
            if ($clinicConflict) {
                return 'This doctor has a conflicting clinic appointment on '.$date->format('F j, Y').'.';
            }
            $date = $date->addDay();
        }

        return null;
    }
}
