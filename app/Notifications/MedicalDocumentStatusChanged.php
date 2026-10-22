<?php

namespace App\Notifications;

use App\Models\MedicalDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MedicalDocumentStatusChanged extends Notification
{
    use Queueable;

    public function __construct(private readonly MedicalDocument $document) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $message = match ($this->document->status) {
            'ready_for_pickup' => "Your {$this->document->title} is ready for pickup at Living Myth Industrial Clinic. Please follow the clinic's release instructions.",
            'released' => "Your {$this->document->title} has been marked as released by the clinic.",
            'approved' => "Your {$this->document->title} has been approved and is being prepared for release.",
            'cancelled', 'voided' => "Your {$this->document->title} is no longer active. Please contact the clinic for assistance.",
            default => "Your {$this->document->title} is currently being processed.",
        };

        return [
            'type' => 'medical_document_status',
            'title' => 'Medical document update',
            'message' => $message,
            'document_id' => $this->document->id,
            'document_type' => $this->document->document_type,
            'status' => $this->document->status,
            'url' => '/my-medical-documents',
        ];
    }
}
