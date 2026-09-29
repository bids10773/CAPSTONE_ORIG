<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function view(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'patient' && $appointment->user_id === $user->id)
            || $this->companyOwnsAppointment($user, $appointment)
            || ($user->role === 'doctor'
                && $appointment->bulk_appointment_id === null
                && $this->isAssignedDoctor($user, $appointment));
    }

    public function viewClinicalForms(User $user, Appointment $appointment): bool
    {
        return $this->viewPhysicalExam($user, $appointment)
            || $this->viewLaboratory($user, $appointment)
            || $this->viewXray($user, $appointment);
    }

    public function viewPhysicalExam(User $user, Appointment $appointment): bool
    {
        if ($this->canViewOwnOrAdmin($user, $appointment)) {
            return true;
        }

        return $user->role === 'doctor' && $this->doctorHasRecordAccess($user, $appointment);
    }

    public function viewLaboratory(User $user, Appointment $appointment): bool
    {
        if ($this->canViewOwnOrAdmin($user, $appointment)) {
            return true;
        }

        if ($user->role === 'doctor') {
            return $this->doctorHasRecordAccess($user, $appointment);
        }

        return $user->role === 'medtech'
            && app(\App\Services\LaboratoryFormDefinition::class)->sectionsFor($appointment) !== []
            && ($appointment->bulk_appointment_id === null
                || $this->hasAssignedTask($user, $appointment, ['medtech'])
                || $appointment->labResult?->encoded_by === $user->id);
    }

    public function viewXray(User $user, Appointment $appointment): bool
    {
        if ($this->canViewOwnOrAdmin($user, $appointment)) {
            return true;
        }

        if ($user->role === 'doctor') {
            return $this->doctorHasRecordAccess($user, $appointment);
        }

        return $user->role === 'radtech'
            && $appointment->requiresXray()
            && ($appointment->bulk_appointment_id === null
                || $this->hasAssignedTask($user, $appointment, ['radtech'])
                || $appointment->xrayReport?->radiologist_id === $user->id);
    }

    private function canViewOwnOrAdmin(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'patient' && $appointment->user_id === $user->id)
            || $this->companyOwnsAppointment($user, $appointment);
    }

    private function companyOwnsAppointment(User $user, Appointment $appointment): bool
    {
        return $user->role === 'company'
            && $user->company_id !== null
            && $appointment->company_id === $user->company_id
            && $appointment->user?->role === 'patient';
    }

    private function doctorHasRecordAccess(User $user, Appointment $appointment): bool
    {
        return $appointment->bulk_appointment_id === null
            ? $this->isAssignedDoctor($user, $appointment)
            : ($this->hasAssignedTask($user, $appointment, ['doctor', 'drug_verification', 'final_evaluation'])
                || $appointment->medicalExamination?->examining_doctor_id === $user->id
                || $appointment->medicalExamination?->finalized_by === $user->id);
    }

    public function updateLaboratory(User $user, Appointment $appointment): bool
    {
        $drugVerification = $appointment->medicalExamination?->diagnosticResults
            ?->firstWhere('service_key', 'drug_test');
        $isVerificationUpdate = in_array($drugVerification?->status, ['verifying', 'awaiting_official_result', 'official_result_received'], true);

        return $user->role === 'medtech'
            && $this->eligibleOnsiteStaff($user, $appointment, 'medtech')
            && $appointment->status !== 'completed'
            && app(\App\Services\LaboratoryFormDefinition::class)->sectionsFor($appointment) !== []
            && (! $isVerificationUpdate
                || $appointment->bulk_appointment_id !== null
                || $appointment->labResult?->encoded_by === $user->id);
    }

    public function updatePhysicalExam(User $user, Appointment $appointment): bool
    {
        return $user->role === 'doctor'
            && $this->eligibleOnsiteStaff($user, $appointment, 'doctor')
            && ($appointment->appointment_date?->isToday() ?? false)
            && $appointment->status !== 'completed'
            && in_array('PE', $appointment->service_types ?? [], true)
            && ($appointment->bulk_appointment_id === null
                ? $this->isAssignedDoctor($user, $appointment)
                : ($appointment->doctor_id === null || $appointment->doctor_id === $user->id));
    }

    public function updateXray(User $user, Appointment $appointment): bool
    {
        return $user->role === 'radtech'
            && $this->eligibleOnsiteStaff($user, $appointment, 'radtech')
            && $appointment->status !== 'completed'
            && $appointment->requiresXray();
    }

    public function finalizeMedicalEvaluation(User $user, Appointment $appointment): bool
    {
        return $user->role === 'doctor'
            && $this->eligibleOnsiteStaff($user, $appointment, 'final_evaluation')
            && ($appointment->bulk_appointment_id !== null || $this->isAssignedDoctor($user, $appointment));
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
                ->where('service_role', in_array($role, ['drug_verification', 'final_evaluation'], true) ? 'doctor' : $role)
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
        return $user->role === 'doctor'
            && ($appointment->bulk_appointment_id === null
                ? $this->isAssignedDoctor($user, $appointment)
                : $this->hasAnyAssignedTask($user, $appointment, ['drug_verification']));
    }

    public function releaseMedicalReport(User $user, Appointment $appointment): bool
    {
        return $user->role === 'doctor'
            && $appointment->medicalExamination?->finalized_at !== null
            && $appointment->medicalExamination?->released_at === null
            && ($appointment->bulk_appointment_id === null
                ? $this->isAssignedDoctor($user, $appointment)
                : $appointment->medicalExamination?->finalized_by === $user->id);
    }

    private function isAssignedDoctor(User $user, Appointment $appointment): bool
    {
        return $appointment->doctor_id !== null && $appointment->doctor_id === $user->id;
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

    private function hasAssignedTask(User $user, Appointment $appointment, array $tasks): bool
    {
        return \App\Models\OnsiteServiceQueue::query()
            ->where('appointment_id', $appointment->id)
            ->where('assigned_staff_id', $user->id)
            ->whereIn('service_role', $tasks)
            ->exists();
    }
}
