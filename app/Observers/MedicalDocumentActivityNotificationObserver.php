<?php

namespace App\Observers;

use App\Models\MedicalDocumentAudit;
use App\Services\WorkflowNotificationService;
use App\Support\NotificationWording as W;

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
            $document = $audit->medicalDocument;
            $reference = $document ? 'Medical document '.($document->document_number ?: '#'.$document->id) : 'A medical document';
            $message = str_replace('A medical document', $reference, rtrim($message, '.')).W::by($audit->actor).'.';
            $title = match ($audit->action) {
                'reviewed' => 'Medical document reviewed',
                'marked_ready' => 'Medical document ready for pickup',
                'released' => 'Medical document released',
                'release_reversed' => 'Medical document release reversed',
            };
            app(WorkflowNotificationService::class)->admins('medical_document_'.$audit->action,
                $title, $message, '/medical-documents');
        }
    }
}
