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
        return $notifiable->email ? ['mail'] : [];
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
