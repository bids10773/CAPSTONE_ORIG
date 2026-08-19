<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\OnsiteEventStaff;
use App\Models\OnsiteServiceQueue;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OnsiteEventWorkflowService
{
    public const ABSENCE_REASONS = ['no_show', 'company_advised', 'employee_unavailable', 'removed_by_company', 'rescheduled', 'other'];

    public function markArrived(Appointment $employee, User $actor): void
    {
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
        }, 3);
    }

    public function markAbsent(Appointment $employee, User $actor, ?string $reason, ?string $details): void
    {
        DB::transaction(function () use ($employee, $actor, $reason, $details): void {
            $employee = Appointment::query()->lockForUpdate()->findOrFail($employee->id);
            $this->assertBulkEmployee($employee);
            $roles = $employee->serviceQueues()->whereIn('status', ['assigned', 'in_progress'])->pluck('service_role');
            $employee->serviceQueues()->whereNotIn('status', ['completed'])->update(['status' => 'removed', 'assigned_staff_id' => null]);
            $employee->update(['attendance_status' => 'absent', 'attendance_marked_by' => $actor->id, 'attendance_marked_at' => now(), 'absence_reason' => $reason, 'absence_details' => $details, 'status' => 'absent']);
            foreach ($roles as $role) {
                $this->assignNext($employee->bulk_appointment_id, $role);
            }
        }, 3);
    }

    public function assignStaff(Appointment $event, User $staff, string $role, int $capacity, ?User $actor = null): OnsiteEventStaff
    {
        $this->assertParent($event);
        $expected = ['doctor' => 'doctor', 'medtech' => 'medtech', 'radtech' => 'radtech', 'receptionist' => 'receptionist'][$role] ?? null;
        if ($expected === null || $staff->role !== $expected || ! $staff->is_active) {
            throw ValidationException::withMessages(['staff' => 'Select an active staff member matching the deployment role.']);
        }

        if (! $event->start_time || ! $event->end_time) {
            throw ValidationException::withMessages(['schedule' => 'Confirm the event start and end time before assigning staff.']);
        }
        $conflict = OnsiteEventStaff::query()->where('user_id', $staff->id)->where('is_active', true)->where('bulk_appointment_id', '!=', $event->id)
            ->whereHas('bulkAppointment', fn ($q) => $q->whereDate('appointment_date', $event->appointment_date)->whereNotIn('status', ['cancelled', 'completed'])->where('start_time', '<', $event->end_time->format('H:i'))->where('end_time', '>', $event->start_time->format('H:i')))->exists();
        if ($conflict) {
            throw ValidationException::withMessages(['staff' => 'This staff member has an overlapping onsite assignment.']);
        }
        if ($staff->role === 'doctor' && Appointment::query()->where('doctor_id', $staff->id)->whereDate('appointment_date', $event->appointment_date)->whereNotIn('status', ['cancelled', 'rejected', 'completed'])->where('start_time', '<', $event->end_time->format('H:i'))->where('end_time', '>', $event->start_time->format('H:i'))->exists()) {
            throw ValidationException::withMessages(['staff' => 'This doctor has a conflicting clinic appointment.']);
        }

        return OnsiteEventStaff::query()->updateOrCreate(['bulk_appointment_id' => $event->id, 'user_id' => $staff->id, 'service_role' => $role], ['queue_capacity' => $capacity, 'is_active' => true, 'assigned_by' => $actor?->id, 'assigned_at' => now()]);
    }

    public function removeStaff(Appointment $event, OnsiteEventStaff $deployment): void
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
    }

    public function assignNext(int $eventId, string $role): ?OnsiteServiceQueue
    {
        return DB::transaction(function () use ($eventId, $role) {
            $deployments = OnsiteEventStaff::query()->where('bulk_appointment_id', $eventId)->where('service_role', $role)->where('is_active', true)->lockForUpdate()->get();
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

    public function completeService(Appointment $employee, string $role, User $actor): void
    {
        if ($employee->bulk_appointment_id === null) {
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

    private function assertParent(Appointment $event): void
    {
        if (! $event->isBulkParent()) {
            throw ValidationException::withMessages(['event' => 'Select a parent onsite event.']);
        }
    }
}
