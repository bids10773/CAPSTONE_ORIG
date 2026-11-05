<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MedicalReportReleased extends Notification implements ShouldQueue
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return $notifiable->email ? ['database', 'mail'] : ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'medical_service_update',
            'title' => 'Medical Service Update',
            'message' => 'Your medical report is finalized. Check its clinic collection status for printed results.',
            'url' => route('medical-documents.patient', absolute: false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Medical report finalized for clinic collection')
            ->greeting('Hello '.$notifiable->first_name.',')
            ->line('Your Medical Examination Report has been finalized.')
            ->line('Please check your document collection status and visit the clinic when your printed report is ready for pickup.')
            ->action('Track clinic collection', route('medical-documents.patient'));
    }
}
