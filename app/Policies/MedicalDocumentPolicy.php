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
            && $document->status === 'approved'
            && $this->certificateIssued($document)
            && $document->audits()
                ->where('action', 'reviewed')
                ->where('actor_id', $user->id)
                ->exists();
    }

    public function release(User $user, MedicalDocument $document): bool
    {
        return in_array($user->role, ['admin', 'receptionist'], true)
            && $document->status === 'ready_for_pickup'
            && $this->certificateIssued($document);
    }

    public function reverseRelease(User $user, MedicalDocument $document): bool
    {
        return $user->role === 'admin' && $document->status === 'released';
    }

    private function certificateIssued(MedicalDocument $document): bool
    {
        if ($document->document_type === 'physical_examination'
            && $document->appointment?->examination_purpose === 'medical_clearance') {
            return false;
        }

        return $document->document_type !== 'medical_certificate'
            || $document->medicalCertificate()->where('status', 'issued')->exists();
    }
}
