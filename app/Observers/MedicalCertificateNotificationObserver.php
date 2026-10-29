<?php

namespace App\Observers;

use App\Models\MedicalCertificate;
use App\Models\User;
use App\Services\WorkflowNotificationService;

class MedicalCertificateNotificationObserver
{
    public function created(MedicalCertificate $certificate): void
    {
        $this->announce($certificate, 'created', 'A medical certificate draft was created.');
    }

    public function updated(MedicalCertificate $certificate): void
    {
        if (! $certificate->wasChanged(array_diff($certificate->getFillable(), ['updated_by']))) {
            return;
        }
        $action = $certificate->wasChanged('status') ? $certificate->status : 'updated';
        $message = match ($action) {
            'pending_approval' => 'A medical certificate was submitted for physician approval.',
            'approved' => 'A medical certificate was approved for issuance.',
            'changes_requested' => 'A medical certificate was returned for correction.',
            'issued' => 'A medical certificate was issued.',
            'void' => 'A medical certificate was voided.',
            default => 'A medical certificate draft was updated.',
        };
        $this->announce($certificate, $action, $message);
    }

    private function announce(MedicalCertificate $certificate, string $action, string $message): void
    {
        $service = app(WorkflowNotificationService::class);
        $url = '/medical-certificates/'.$certificate->id;
        $type = 'medical_certificate_'.$action;
        $service->admins($type, 'Medical certificate update', $message, $url);
        $ids = collect([$certificate->created_by, $certificate->attending_physician_id]);
        if (in_array($action, ['approved', 'issued', 'void'], true)) {
            $ids = $ids->merge(User::query()->where('role', 'receptionist')->pluck('id'));
        }
        $recipients = User::query()->whereIn('id', $ids->filter()->unique())
            ->where('role', '!=', 'admin')->where('id', '!=', auth()->id())
            ->get()->filter(fn (User $user) => $user->can('view', $certificate));
        $service->users($recipients, $type, 'Medical certificate update', $message, $url);
    }
}
