<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\User;

class OnsiteStaffingRecommendationService
{
    public function for(Appointment $event): array
    {
        $employeeCount = max(1, $event->bulkEmployees()->count() ?: (int) $event->expected_employee_count);
        $requiredRoles = $this->requiredRoles($event);
        $ratios = config('onsite.staffing_ratios');

        return collect(['doctor', 'medtech', 'radtech', 'receptionist'])->mapWithKeys(function (string $role) use ($event, $employeeCount, $requiredRoles, $ratios) {
            $required = in_array($role, $requiredRoles, true);
            $recommended = $required ? max(1, (int) ceil($employeeCount / max(1, (int) $ratios[$role]))) : 0;

            return [$role => [
                'required' => $required,
                'recommended' => $recommended,
                'active_available' => User::where('role', $role)->where('is_active', true)->get()
                    ->filter(fn (User $staff) => app(OnsiteStaffAvailabilityService::class)->conflictReason($event, $staff) === null)->count(),
                'employees_per_staff' => (int) $ratios[$role],
            ]];
        })->all();
    }

    public function requiredRoles(Appointment $event): array
    {
        return collect(['receptionist'])
            ->when(in_array('PE', $event->service_types ?? [], true), fn ($roles) => $roles->push('doctor'))
            ->when(app(LaboratoryFormDefinition::class)->sectionsFor($event) !== [], fn ($roles) => $roles->push('medtech'))
            ->when($event->requiresXray(), fn ($roles) => $roles->push('radtech'))
            ->unique()->values()->all();
    }
}
