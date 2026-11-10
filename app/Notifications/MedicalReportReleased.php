<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\User;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MedicalReportReleased extends Notification implements ShouldQueue
{
    use Queueable;

    private readonly string $message;

    public function __construct(?Appointment $appointment = null, User|int|null $actor = null)
    {
        $this->message = 'Your medical report'.($appointment ? ' for '.NotificationWording::appointment($appointment) : '').' was forwarded to reception for collection preparation'.NotificationWording::by($actor).'.';
    }

    public function via(object $notifiable): array
    {
        return $notifiable->email ? ['database', 'mail'] : ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'medical_service_update',
            'title' => 'Medical report forwarded to reception',
            'message' => $this->message,
            'url' => route('medical-documents.patient', absolute: false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Medical report forwarded to reception')
            ->greeting('Hello '.$notifiable->first_name.',')
            ->line($this->message)
            ->line('Please check your document collection status and visit the clinic when your printed report is ready for pickup.')
            ->action('Track clinic collection', route('medical-documents.patient'));
    }
}
