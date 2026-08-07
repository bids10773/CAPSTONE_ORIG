<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
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
                && $appointment->status !== 'completed'
                && ($appointment->doctor_id === null || $appointment->doctor_id === $user->id));
    }
}
