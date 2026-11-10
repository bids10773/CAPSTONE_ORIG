<?php

namespace App\Notifications;

use App\Models\MedicalDocument;
use App\Models\User;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MedicalDocumentStatusChanged extends Notification
{
    use Queueable;

    private readonly string $actorSuffix;

    public function __construct(private readonly MedicalDocument $document, User|int|null $actor = null, private readonly ?string $action = null)
    {
        $fallbackActor = in_array($action, ['issued', 'draft', 'pending_approval', 'changes_requested', 'release_reversed'], true) ? null : match ($document->status) {
            'approved' => $document->approved_by,
            'released' => $document->released_by,
            'cancelled', 'voided' => $document->cancelled_by,
            default => null,
        };
        $this->actorSuffix = NotificationWording::by($actor ?? $fallbackActor);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $record = $this->document->title.(filled($this->document->document_number) ? ' ('.$this->document->document_number.')' : '');
        $by = $this->actorSuffix;
        $reversed = $this->action === 'release_reversed';
        $sourceMessage = match ($this->action) {
            'pending_approval' => "Your {$record} was submitted for physician approval{$by}.",
            'changes_requested' => "Your {$record} was returned for correction{$by}.",
            'draft' => "A draft of your {$record} was saved{$by}. It has not been approved or issued.",
            'issued' => "Your {$record} was issued{$by} and is being prepared for release.",
            default => null,
        };
        $sourceTitle = match ($this->action) {
            'pending_approval' => 'Medical certificate submitted for approval',
            'changes_requested' => 'Medical certificate returned for correction',
            'draft' => 'Medical certificate draft saved',
            'issued' => 'Medical certificate issued',
            default => null,
        };
        $message = $sourceMessage ?? ($reversed
            ? "The release of your {$record} was reversed{$by}. Your document is ready for pickup again. Please follow the clinic's release instructions."
            : match ($this->document->status) {
                'ready_for_pickup' => "Your {$record} is ready for pickup at Living Myth Industrial Clinic.".($by ? " It was marked ready{$by}." : '')." Please follow the clinic's release instructions.",
                'released' => "Your {$record} was released{$by}.",
                'approved' => "Your {$record} was approved{$by} and is being prepared for release.",
                'cancelled' => "Your {$record} was cancelled{$by}. Please contact the clinic for assistance.",
                'voided' => "Your {$record} was voided{$by}. Please contact the clinic for assistance.",
                'for_review' => $by ? "Your {$record} was submitted for review{$by}." : "Your {$record} is awaiting review.",
                default => $by ? "The processing status of your {$record} was updated{$by}." : "Your {$record} is currently being processed.",
            });

        return [
            'type' => 'medical_document_status',
            'title' => $sourceTitle ?? ($reversed ? 'Medical document release reversed' : match ($this->document->status) {
                'ready_for_pickup' => 'Medical document ready for pickup',
                'released' => 'Medical document released',
                'approved' => 'Medical document approved',
                'cancelled' => 'Medical document cancelled',
                'voided' => 'Medical document voided',
                'for_review' => 'Medical document awaiting review',
                default => 'Medical document processing',
            }),
            'message' => $message,
            'document_id' => $this->document->id,
            'document_type' => $this->document->document_type,
            'status' => $this->document->status,
            'url' => '/my-medical-documents',
        ];
    }
}
