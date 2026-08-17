<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MedicalReportReleased extends Notification
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
            'message' => 'An update is available for your medical record.',
            'url' => route('appointments.index', ['status' => 'completed'], false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your final medical report is available')
            ->greeting('Hello '.$notifiable->first_name.',')
            ->line('Your medical examination has been finalized and released.')
            ->line('Your final medical report is now available in your patient portal.');
    }
}
