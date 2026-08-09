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
            'doctor' => $appointment->doctor_id === null || $appointment->doctor_id === $user->id,
            'medtech' => app(\App\Services\LaboratoryFormDefinition::class)->sectionsFor($appointment) !== [],
            'radtech' => $appointment->requiresXray(),
            default => false,
        };
    }

    public function updateLaboratory(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'medtech'
                && $appointment->status !== 'completed'
                && app(\App\Services\LaboratoryFormDefinition::class)->sectionsFor($appointment) !== []);
    }

    public function updatePhysicalExam(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'doctor'
                && $appointment->status !== 'completed'
                && in_array('PE', $appointment->service_types ?? [], true)
                && ($appointment->doctor_id === null || $appointment->doctor_id === $user->id));
    }

    public function updateXray(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'radtech'
                && $appointment->status !== 'completed'
                && $appointment->requiresXray());
    }

    public function finalizeMedicalEvaluation(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || ($user->role === 'doctor'
                && ($appointment->doctor_id === null || $appointment->doctor_id === $user->id));
    }

    public function verifyDiagnosticResults(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, ['doctor', 'admin'], true)
            && ($user->role === 'admin' || $appointment->doctor_id === null || $appointment->doctor_id === $user->id);
    }

    public function releaseMedicalReport(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, ['doctor', 'admin'], true)
            && $appointment->medicalExamination?->finalized_at !== null
            && $appointment->medicalExamination?->released_at === null
            && ($user->role === 'admin' || $appointment->doctor_id === null || $appointment->doctor_id === $user->id);
    }
}
