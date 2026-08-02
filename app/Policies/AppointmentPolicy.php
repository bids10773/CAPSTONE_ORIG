<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function viewClinicalForms(User $user, Appointment $appointment): bool
    {
        return $user->role === 'admin'
            || in_array($user->role, ['doctor', 'medtech', 'radtech'], true)
            || $appointment->user_id === $user->id;
    }

    public function updateLaboratory(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, ['medtech', 'admin'], true);
    }

    public function updatePhysicalExam(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, ['doctor', 'admin'], true);
    }

    public function updateXray(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, ['radtech', 'admin'], true);
    }

    public function finalizeMedicalEvaluation(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, ['doctor', 'admin'], true);
    }
}
