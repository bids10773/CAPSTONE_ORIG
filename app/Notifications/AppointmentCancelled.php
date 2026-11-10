<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\User;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentCancelled extends Notification
{
    use Queueable;

    private readonly string $message;

    public function __construct(public readonly Appointment $appointment, User|int|null $actor = null)
    {
        $this->message = 'Your '.NotificationWording::appointment($appointment).' for '.NotificationWording::schedule($appointment).' was cancelled'.NotificationWording::by($actor).'.';
    }

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return $notifiable->email ? ['database', 'mail'] : ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'appointment_cancelled',
            'title' => 'Appointment cancelled',
            'message' => $this->message
                .(filled($this->appointment->cancellation_reason) ? ' Reason: '.$this->appointment->cancellation_reason : ''),
            'cancellation_reason' => $this->appointment->cancellation_reason,
            'appointment_id' => $this->appointment->id,
            'url' => route('appointments.index', absolute: false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Appointment cancelled | Living Myth Industrial Clinic')
            ->greeting('Hello '.$notifiable->first_name.',')
            ->line($this->message);

        if (filled($this->appointment->cancellation_reason)) {
            $message->line('Reason: '.$this->appointment->cancellation_reason);
        }

        return $message
            ->line('Please contact the clinic if you need assistance or book another available appointment.')
            ->action('View appointments', route('appointments.index'));
    }
}
