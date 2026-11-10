<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentAutoCancelled extends Notification
{
    use Queueable;

    private readonly string $message;

    public function __construct(private readonly Appointment $appointment)
    {
        $reason = $appointment->cancellation_reason === 'schedule_expired'
            ? 'the appointment schedule expired before check-in'
            : 'you were not checked in within 10 minutes of the scheduled time';
        $this->message = 'The system cancelled your '.NotificationWording::appointment($appointment).' for '.NotificationWording::schedule($appointment).' because '.$reason.'.';
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
            'title' => 'Appointment automatically cancelled',
            'message' => $this->message,
            'appointment_id' => $this->appointment->id,
            'url' => route('appointments.index', absolute: false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Appointment automatically cancelled')
            ->greeting('Hello '.$notifiable->first_name.',')
            ->line($this->message)
            ->line('Please contact the clinic or book the next available appointment.');
    }
}
