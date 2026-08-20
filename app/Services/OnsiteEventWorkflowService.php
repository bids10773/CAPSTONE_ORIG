<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\OnsiteEventStaff;
use App\Models\OnsiteServiceQueue;
use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OnsiteEventWorkflowService
{
    public const ABSENCE_REASONS = ['no_show', 'company_advised', 'employee_unavailable', 'removed_by_company', 'rescheduled', 'other'];

    public function markArrived(Appointment $employee, User $actor): void
    {
        $this->assertReceptionist($actor);
        DB::transaction(function () use ($employee, $actor): void {
            $employee = Appointment::query()->lockForUpdate()->findOrFail($employee->id);
            $this->assertBulkEmployee($employee);
            if ($employee->attendance_status === 'absent') {
                throw ValidationException::withMessages(['attendance' => 'An absent employee cannot be checked in without first correcting the attendance record.']);
            }
            $employee->update(['attendance_status' => 'arrived', 'attendance_marked_by' => $actor->id, 'attendance_marked_at' => now(), 'arrived_at' => now(), 'checked_in_by' => $actor->id, 'status' => 'arrived', 'absence_reason' => null, 'absence_details' => null]);
            foreach ($this->requiredRoles($employee) as $role) {
                OnsiteServiceQueue::query()->firstOrCreate(['appointment_id' => $employee->id, 'service_role' => $role], ['bulk_appointment_id' => $employee->bulk_appointment_id, 'status' => 'waiting']);
                $this->assignNext($employee->bulk_appointment_id, $role);
            }
            $this->auditAttendance($employee, $actor, 'arrived');
        }, 3);
    }

    public function markAbsent(Appointment $employee, User $actor, ?string $reason, ?string $details): void
    {
        $this->assertReceptionist($actor);
        DB::transaction(function () use ($employee, $actor, $reason, $details): void {
            $employee = Appointment::query()->lockForUpdate()->findOrFail($employee->id);
            $this->assertBulkEmployee($employee);
            $roles = $employee->serviceQueues()->whereIn('status', ['assigned', 'in_progress'])->pluck('service_role');
            $employee->serviceQueues()->whereNotIn('status', ['completed'])->update(['status' => 'removed', 'assigned_staff_id' => null]);
            $employee->update(['attendance_status' => 'absent', 'attendance_marked_by' => $actor->id, 'attendance_marked_at' => now(), 'absence_reason' => $reason, 'absence_details' => $details, 'status' => 'absent']);
            foreach ($roles as $role) {
                $this->assignNext($employee->bulk_appointment_id, $role);
            }
            $this->auditAttendance($employee, $actor, 'absent', ['reason' => $reason, 'details' => $details]);
        }, 3);
    }

    public function assignStaff(Appointment $event, User $staff, string $role, int $capacity, ?User $actor = null): OnsiteEventStaff
    {
        $this->assertParent($event);
        $expected = ['doctor' => 'doctor', 'medtech' => 'medtech', 'radtech' => 'radtech', 'receptionist' => 'receptionist'][$role] ?? null;
        if ($expected === null || $staff->role !== $expected || ! $staff->is_active) {
            throw ValidationException::withMessages(['staff' => 'Select an active staff member matching the deployment role.']);
        }

        if (in_array($event->status, ['pending', 'rejected', 'cancelled'], true)) {
            throw ValidationException::withMessages(['event' => 'Approve and schedule the bulk request before assigning staff.']);
        }
        if ($reason = app(OnsiteStaffAvailabilityService::class)->conflictReason($event, $staff)) {
            throw ValidationException::withMessages(['staff' => $reason]);
        }

        $deployment = OnsiteEventStaff::query()->updateOrCreate(['bulk_appointment_id' => $event->id, 'user_id' => $staff->id, 'service_role' => $role], ['queue_capacity' => $capacity, 'is_active' => true, 'assigned_by' => $actor?->id, 'assigned_at' => now()]);
        SecurityAudit::create(['actor_id' => $actor?->id, 'target_user_id' => $staff->id, 'action' => 'onsite_staff_assigned', 'status' => 'success', 'metadata' => ['bulk_appointment_id' => $event->id, 'service_role' => $role, 'queue_capacity' => $capacity]]);

        return $deployment;
    }

    public function removeStaff(Appointment $event, OnsiteEventStaff $deployment, ?User $actor = null): void
    {
        $this->assertParent($event);
        if ($deployment->bulk_appointment_id !== $event->id) {
            abort(404);
        }
        DB::transaction(function () use ($event, $deployment): void {
            $deployment = OnsiteEventStaff::query()->lockForUpdate()->findOrFail($deployment->id);
            $active = OnsiteServiceQueue::where('bulk_appointment_id', $event->id)->where('service_role', $deployment->service_role)->where('assigned_staff_id', $deployment->user_id);
            if ((clone $active)->where('status', 'in_progress')->exists()) {
                throw ValidationException::withMessages(['staff' => 'This staff member is actively processing an employee.']);
            }
            (clone $active)->where('status', 'assigned')->update(['assigned_staff_id' => null, 'assigned_at' => null, 'status' => 'waiting']);
            $deployment->update(['is_active' => false]);
            while ($this->assignNext($event->id, $deployment->service_role)) {
            }
        }, 3);
        SecurityAudit::create(['actor_id' => $actor?->id, 'target_user_id' => $deployment->user_id, 'action' => 'onsite_staff_removed', 'status' => 'success', 'metadata' => ['bulk_appointment_id' => $event->id, 'service_role' => $deployment->service_role]]);
    }

    public function assignNext(int $eventId, string $role): ?OnsiteServiceQueue
    {
        return DB::transaction(function () use ($eventId, $role) {
            $deploymentRole = $this->deploymentRole($role);
            $deployments = OnsiteEventStaff::query()->where('bulk_appointment_id', $eventId)->where('service_role', $deploymentRole)->where('is_active', true)->lockForUpdate()->get();
            $available = $deployments->map(function ($deployment) {
                $load = OnsiteServiceQueue::query()->where('assigned_staff_id', $deployment->user_id)->whereIn('status', ['assigned', 'in_progress'])->count();

                return ['deployment' => $deployment, 'load' => $load];
            })->filter(fn ($item) => $item['load'] < $item['deployment']->queue_capacity)->sortBy(fn ($item) => $item['load'].':'.str_pad((string) $item['deployment']->id, 10, '0', STR_PAD_LEFT))->first();
            if (! $available) {
                return null;
            }
            $queue = OnsiteServiceQueue::query()->where('bulk_appointment_id', $eventId)->where('service_role', $role)->where('status', 'waiting')->whereNull('assigned_staff_id')->orderBy('id')->lockForUpdate()->first();
            if (! $queue) {
                return null;
            }
            $queue->update(['assigned_staff_id' => $available['deployment']->user_id, 'status' => 'assigned', 'assigned_at' => now()]);

            return $queue->refresh();
        }, 3);
    }

    public function startService(Appointment $employee, string $role, User $actor): void
    {
        if ($employee->bulk_appointment_id === null || $actor->role === 'admin') {
            return;
        }

        $updated = OnsiteServiceQueue::query()
            ->where('appointment_id', $employee->id)
            ->where('service_role', $role)
            ->where('assigned_staff_id', $actor->id)
            ->whereIn('status', ['assigned', 'in_progress'])
            ->update(['status' => 'in_progress', 'started_at' => now()]);

        if ($updated === 0) {
            throw ValidationException::withMessages(['queue' => 'This employee is not assigned to your onsite queue.']);
        }
    }

    public function completeService(Appointment $employee, string $role, User $actor): void
    {
        if ($employee->bulk_appointment_id === null || $actor->role === 'admin') {
            return;
        }
        DB::transaction(function () use ($employee, $role, $actor): void {
            $queue = OnsiteServiceQueue::query()->where('appointment_id', $employee->id)->where('service_role', $role)->lockForUpdate()->first();
            if (! $queue || $queue->assigned_staff_id !== $actor->id) {
                throw ValidationException::withMessages(['queue' => 'This employee is not assigned to your onsite queue.']);
            }
            $queue->update(['status' => 'completed', 'completed_at' => now()]);
            $this->assignNext($employee->bulk_appointment_id, $role);
        }, 3);
    }

    public function createDoctorTask(Appointment $employee, string $task): ?OnsiteServiceQueue
    {
        if ($employee->bulk_appointment_id === null) {
            return null;
        }

        return DB::transaction(function () use ($employee, $task): OnsiteServiceQueue {
            $queue = OnsiteServiceQueue::query()->firstOrCreate(
                ['appointment_id' => $employee->id, 'service_role' => $task],
                ['bulk_appointment_id' => $employee->bulk_appointment_id, 'status' => 'waiting']
            );
            $this->assignNext($employee->bulk_appointment_id, $task);

            return $queue->refresh();
        }, 3);
    }

    public function refreshFinalEvaluationTask(Appointment $employee): void
    {
        $examination = $employee->medicalExamination;
        if (! $examination) {
            return;
        }
        $examination->loadMissing(['appointment', 'physicalExam', 'laboratoryResult', 'diagnosticResults', 'xrayReport']);
        if ($examination->isReadyForFinalEvaluation()) {
            $employee->update(['status' => 'for_final_evaluation']);
            $examination->update(['status' => 'ready_for_final_evaluation']);
            $this->createDoctorTask($employee, 'final_evaluation');
        }
    }

    private function deploymentRole(string $task): string
    {
        return in_array($task, ['doctor', 'drug_verification', 'xray_verification', 'final_evaluation'], true) ? 'doctor' : $task;
    }

    private function requiredRoles(Appointment $employee): array
    {
        $roles = [];
        if ($employee->isPePackage()) {
            $roles[] = 'doctor';
        }
        if (app(LaboratoryFormDefinition::class)->sectionsFor($employee) !== []) {
            $roles[] = 'medtech';
        }
        if ($employee->requiresXray()) {
            $roles[] = 'radtech';
        }

        return $roles;
    }

    private function assertBulkEmployee(Appointment $appointment): void
    {
        if ($appointment->bulk_appointment_id === null) {
            throw ValidationException::withMessages(['employee' => 'Select an employee in an onsite event.']);
        }
    }

    private function assertReceptionist(User $actor): void
    {
        if ($actor->role !== 'receptionist') {
            throw ValidationException::withMessages(['attendance' => 'Only an assigned receptionist may record onsite attendance.']);
        }
    }

    private function auditAttendance(Appointment $employee, User $actor, string $status, array $extra = []): void
    {
        SecurityAudit::create([
            'actor_id' => $actor->id,
            'target_user_id' => $employee->user_id,
            'action' => 'onsite_employee_marked_'.$status,
            'status' => 'success',
            'metadata' => array_merge([
                'appointment_id' => $employee->id,
                'bulk_appointment_id' => $employee->bulk_appointment_id,
                'attendance_status' => $status,
                'changed_at' => now()->toIso8601String(),
            ], $extra),
        ]);
    }

    private function assertParent(Appointment $event): void
    {
        if (! $event->isBulkParent()) {
            throw ValidationException::withMessages(['event' => 'Select a parent onsite event.']);
        }
    }
}
