<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function view(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'patient' && $appointment->user_id === $user->id);
    }

    public function viewClinicalForms(User $user, Appointment $appointment): bool
    {
        if ($user->role === 'admin' || $appointment->user_id === $user->id) {
            return true;
        }

        return match ($user->role) {
            'doctor' => $appointment->bulk_appointment_id === null
                ? ($appointment->doctor_id === null || $appointment->doctor_id === $user->id)
                : ($this->hasAnyAssignedTask($user, $appointment, ['doctor', 'drug_verification', 'xray_verification', 'final_evaluation'])
                    || $appointment->medicalExamination?->examining_doctor_id === $user->id
                    || $appointment->medicalExamination?->finalized_by === $user->id),
            'medtech' => app(\App\Services\LaboratoryFormDefinition::class)->sectionsFor($appointment) !== []
                && $this->eligibleOnsiteStaff($user, $appointment, 'medtech'),
            'radtech' => $appointment->requiresXray() && $this->eligibleOnsiteStaff($user, $appointment, 'radtech'),
            default => false,
        };
    }

    public function updateLaboratory(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'medtech'
                && $this->eligibleOnsiteStaff($user, $appointment, 'medtech')
                && $appointment->status !== 'completed'
                && app(\App\Services\LaboratoryFormDefinition::class)->sectionsFor($appointment) !== []);
    }

    public function updatePhysicalExam(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'doctor'
                && $this->eligibleOnsiteStaff($user, $appointment, 'doctor')
                && $appointment->status !== 'completed'
                && in_array('PE', $appointment->service_types ?? [], true)
                && ($appointment->doctor_id === null || $appointment->doctor_id === $user->id));
    }

    public function updateXray(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'radtech'
                && $this->eligibleOnsiteStaff($user, $appointment, 'radtech')
                && $appointment->status !== 'completed'
                && $appointment->requiresXray());
    }

    public function finalizeMedicalEvaluation(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'doctor'
                && $this->eligibleOnsiteStaff($user, $appointment, 'final_evaluation'));
    }

    private function eligibleOnsiteStaff(User $user, Appointment $appointment, string $role): bool
    {
        if ($appointment->bulk_appointment_id === null) {
            return true;
        }

        return $appointment->attendance_status === 'arrived'
            && \App\Models\OnsiteEventStaff::query()
                ->where('bulk_appointment_id', $appointment->bulk_appointment_id)
                ->where('user_id', $user->id)
                ->where('service_role', in_array($role, ['drug_verification', 'xray_verification', 'final_evaluation'], true) ? 'doctor' : $role)
                ->where('is_active', true)
                ->exists()
            && \App\Models\OnsiteServiceQueue::query()
                ->where('appointment_id', $appointment->id)
                ->where('service_role', $role)
                ->where('assigned_staff_id', $user->id)
                ->whereIn('status', ['assigned', 'in_progress'])
                ->exists();
    }

    public function verifyDiagnosticResults(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, ['doctor', 'admin'], true)
            && ($user->role === 'admin' || ($appointment->bulk_appointment_id === null
                ? ($appointment->doctor_id === null || $appointment->doctor_id === $user->id)
                : $this->hasAnyAssignedTask($user, $appointment, ['drug_verification', 'xray_verification'])));
    }

    public function releaseMedicalReport(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, ['doctor', 'admin'], true)
            && $appointment->medicalExamination?->finalized_at !== null
            && $appointment->medicalExamination?->released_at === null
            && ($user->role === 'admin' || ($appointment->bulk_appointment_id === null
                ? ($appointment->doctor_id === null || $appointment->doctor_id === $user->id)
                : $appointment->medicalExamination?->finalized_by === $user->id));
    }

    private function hasAnyAssignedTask(User $user, Appointment $appointment, array $tasks): bool
    {
        return $appointment->attendance_status === 'arrived'
            && \App\Models\OnsiteServiceQueue::query()
                ->where('appointment_id', $appointment->id)
                ->where('assigned_staff_id', $user->id)
                ->whereIn('service_role', $tasks)
                ->whereIn('status', ['assigned', 'in_progress'])
                ->exists();
    }
}
