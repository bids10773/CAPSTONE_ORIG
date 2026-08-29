<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\User;

class OnsiteDashboardService
{
    /** @return array<string, mixed> */
    public function summaryFor(User $staff): array
    {
        $assignments = Appointment::query()
            ->bulkParents()
            ->whereNotIn('status', ['pending', 'rejected', 'cancelled'])
            ->whereHas('onsiteStaff', fn ($query) => $query
                ->where('user_id', $staff->id)
                ->where('service_role', $staff->role)
                ->where('is_active', true));

        $upcoming = (clone $assignments)->whereDate('appointment_date', '>=', today());

        return [
            'today_count' => (clone $assignments)->whereDate('appointment_date', today())->count(),
            'upcoming_count' => (clone $upcoming)->count(),
            'events' => $upcoming
                ->with('company:id,company_name,address')
                ->withCount([
                    'bulkEmployees',
                    'bulkEmployees as arrived_count' => fn ($query) => $query->where('attendance_status', 'arrived'),
                    'bulkEmployees as completed_count' => fn ($query) => $query->where('status', 'completed'),
                ])
                ->orderBy('appointment_date')
                ->limit(3)
                ->get(['id', 'company_id', 'appointment_date', 'start_time', 'status']),
        ];
    }
}
