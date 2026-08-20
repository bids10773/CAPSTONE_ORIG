<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\OnsiteEventStaff;
use App\Models\User;

class OnsiteStaffAvailabilityService
{
    public function conflictReason(Appointment $event, User $staff): ?string
    {
        if (! $event->start_time || ! $event->end_time) {
            return 'Confirm the event start and end time before assigning staff.';
        }
        $start = $event->start_time->format('H:i');
        $end = $event->end_time->format('H:i');
        $overlappingEvent = OnsiteEventStaff::query()->where('user_id', $staff->id)->where('is_active', true)
            ->where('bulk_appointment_id', '!=', $event->id)
            ->whereHas('bulkAppointment', fn ($query) => $query->whereDate('appointment_date', $event->appointment_date)
                ->whereNotIn('status', ['cancelled', 'completed'])->where('start_time', '<', $end)->where('end_time', '>', $start))->exists();
        if ($overlappingEvent) {
            return 'This staff member has an overlapping onsite assignment.';
        }
        if ($staff->role !== 'doctor') {
            return null;
        }
        $day = strtolower($event->appointment_date->format('D'));
        $availability = collect($staff->availability ?? []);
        if ($availability->isNotEmpty() && ! $availability->where('day', $day)->contains(fn ($period) => $start >= $period['start'] && $end <= $period['end'])) {
            return 'This event is outside the doctor\'s recorded availability.';
        }
        $clinicConflict = Appointment::query()->where('doctor_id', $staff->id)->whereDate('appointment_date', $event->appointment_date)
            ->whereNotIn('status', ['cancelled', 'rejected', 'completed'])->where('start_time', '<', $end)->where('end_time', '>', $start)->exists();

        return $clinicConflict ? 'This doctor has a conflicting clinic appointment.' : null;
    }
}
