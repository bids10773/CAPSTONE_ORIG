<?php

namespace App\Observers;

use App\Models\MedicalDocumentAudit;
use App\Services\WorkflowNotificationService;

class MedicalDocumentActivityNotificationObserver
{
    public function created(MedicalDocumentAudit $audit): void
    {
        $message = match ($audit->action) {
            'reviewed' => 'A medical document was reviewed for release.',
            'marked_ready' => 'A medical document was marked ready for pickup.',
            'released' => 'A medical document release was recorded.',
            'release_reversed' => 'A medical document release was reversed.',
            default => null,
        };
        if ($message !== null) {
            app(WorkflowNotificationService::class)->admins('medical_document_'.$audit->action,
                'Medical document update', $message, '/medical-documents');
        }
    }
}
