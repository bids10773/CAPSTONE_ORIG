<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BulkAppointmentEnrollmentService
{
    public function enroll(Appointment $bulkAppointment, User $employee): Appointment
    {
        return DB::transaction(function () use ($bulkAppointment, $employee): Appointment {
            $parent = Appointment::query()->lockForUpdate()->findOrFail($bulkAppointment->id);
            $this->assertParentAndEmployee($parent, $employee);

            $batchId = $parent->batch_id ?: $this->newBatchId($parent);
            if ($parent->batch_id === null) {
                $parent->update(['batch_id' => $batchId]);
            }

            return Appointment::query()->firstOrCreate(
                [
                    'bulk_appointment_id' => $parent->id,
                    'user_id' => $employee->id,
                ],
                [
                    'company_id' => $parent->company_id,
                    'company_name' => $parent->company_name,
                    'appointment_date' => $parent->appointment_date,
                    'type' => 'company_bulk',
                    'status' => $this->employeeStatus($parent->status),
                    'service_types' => $parent->service_types,
                    'batch_id' => $batchId,
                ]
            );
        });
    }

    public function synchronizeParentStatus(Appointment $bulkAppointment, string $status): void
    {
        DB::transaction(function () use ($bulkAppointment, $status): void {
            $parent = Appointment::query()->lockForUpdate()->findOrFail($bulkAppointment->id);
            $parent->update(['status' => $status]);

            if ($status === 'accepted') {
                $parent->bulkEmployees()->where('status', 'pending')->update(['status' => 'accepted']);
            } elseif ($status === 'cancelled') {
                $parent->bulkEmployees()
                    ->whereNotIn('status', ['completed', 'cancelled'])
                    ->update(['status' => 'cancelled']);
            }
        });
    }

    public function recalculateParentStatus(Appointment $employeeAppointment): void
    {
        if ($employeeAppointment->bulk_appointment_id === null) {
            return;
        }

        DB::transaction(function () use ($employeeAppointment): void {
            $parent = Appointment::query()->lockForUpdate()->find($employeeAppointment->bulk_appointment_id);
            if ($parent === null || in_array($parent->status, ['cancelled', 'completed'], true)) {
                return;
            }

            $statuses = $parent->bulkEmployees()->pluck('status');
            if ($statuses->isEmpty()) {
                return;
            }

            $closed = $statuses->every(fn (string $status) => in_array($status, ['completed', 'cancelled'], true));
            $started = $statuses->contains(fn (string $status) => ! in_array($status, ['pending', 'accepted', 'cancelled'], true));

            if ($closed) {
                $parent->updateQuietly(['status' => 'completed']);
            } elseif ($started && $parent->status === 'accepted') {
                $parent->updateQuietly(['status' => 'arrived']);
            }
        });
    }

    private function assertParentAndEmployee(Appointment $parent, User $employee): void
    {
        if ($parent->type !== 'company_bulk' || $parent->bulk_appointment_id !== null) {
            throw ValidationException::withMessages(['bulk_appointment_id' => 'Select a main company bulk appointment.']);
        }
        if ($employee->role !== 'patient' || $employee->company_id !== $parent->company_id) {
            throw ValidationException::withMessages(['employee' => 'The employee must belong to the bulk appointment company.']);
        }
    }

    private function employeeStatus(string $parentStatus): string
    {
        return in_array($parentStatus, ['accepted', 'arrived'], true) ? 'accepted' : 'pending';
    }

    private function newBatchId(Appointment $parent): string
    {
        return 'BULK-'.$parent->appointment_date->format('Ymd').'-'.Str::upper(Str::random(8));
    }
}
