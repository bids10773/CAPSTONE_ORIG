<?php

namespace App\Policies;

use App\Models\MedicalCertificate;
use App\Models\User;

class MedicalCertificatePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'receptionist', 'doctor'], true);
    }

    public function view(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return in_array($user->role, ['admin', 'receptionist'], true)
            || $this->isAttendingPhysician($user, $medicalCertificate);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'receptionist', 'doctor'], true);
    }

    public function update(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return in_array($medicalCertificate->status, ['draft', 'changes_requested'], true)
            && (in_array($user->role, ['admin', 'receptionist'], true)
                || $this->isAttendingPhysician($user, $medicalCertificate));
    }

    public function submit(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $this->update($user, $medicalCertificate);
    }

    public function approve(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $medicalCertificate->status === 'pending_approval'
            && $this->isAttendingPhysician($user, $medicalCertificate)
            && $user->license_verification_status === 'verified'
            && filled($user->license_no);
    }

    public function requestChanges(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $medicalCertificate->status === 'pending_approval'
            && $this->isAttendingPhysician($user, $medicalCertificate);
    }

    public function issue(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $medicalCertificate->status === 'approved'
            && (in_array($user->role, ['admin', 'receptionist'], true)
                || $this->isAttendingPhysician($user, $medicalCertificate));
    }

    public function void(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $medicalCertificate->status === 'issued'
            && ($user->role === 'admin' || $this->isAttendingPhysician($user, $medicalCertificate));
    }

    public function print(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $medicalCertificate->status === 'issued'
            && $this->view($user, $medicalCertificate);
    }

    public function downloadPdf(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $this->print($user, $medicalCertificate);
    }

    public function delete(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return false;
    }

    private function isAttendingPhysician(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $user->role === 'doctor'
            && $medicalCertificate->attending_physician_id === $user->id;
    }
}
