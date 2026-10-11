<?php

namespace App\Policies;

use App\Models\MedicalDocument;
use App\Models\User;

class MedicalDocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['patient', 'admin', 'receptionist', 'doctor', 'medtech', 'radtech'], true);
    }

    public function view(User $user, MedicalDocument $document): bool
    {
        if ($user->role === 'patient') {
            return $document->patient_id === $user->id;
        }

        return MedicalDocument::query()->visibleTo($user)->whereKey($document)->exists();
    }

    public function markReady(User $user, MedicalDocument $document): bool
    {
        return in_array($user->role, ['admin', 'receptionist'], true)
            && $document->status === 'approved';
    }

    public function release(User $user, MedicalDocument $document): bool
    {
        return in_array($user->role, ['admin', 'receptionist'], true)
            && $document->status === 'ready_for_pickup';
    }

    public function reverseRelease(User $user, MedicalDocument $document): bool
    {
        return $user->role === 'admin' && $document->status === 'released';
    }
}
