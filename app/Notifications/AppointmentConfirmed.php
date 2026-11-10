<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\User;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentConfirmed extends Notification
{
    use Queueable;

    private readonly string $message;

    public function __construct(public readonly Appointment $appointment, User|int|null $actor = null)
    {
        $this->message = 'Your '.NotificationWording::appointment($appointment).' for '.NotificationWording::schedule($appointment).' was confirmed'.NotificationWording::by($actor ?? ($appointment->status === 'accepted' ? $appointment->processed_by : null)).'.';
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'appointment_confirmed',
            'title' => 'Appointment confirmed',
            'message' => $this->message,
            'appointment_id' => $this->appointment->id,
            'url' => route('appointments.index', absolute: false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appointment = $this->appointment;

        return (new MailMessage)
            ->subject('Appointment confirmed | Living Myth Industrial Clinic')
            ->greeting('Appointment confirmed')
            ->line($this->message)
            ->line('Schedule: '.NotificationWording::schedule($appointment))

            ->line('Doctor: '.NotificationWording::person($appointment->doctor, 'To be assigned'))
            ->line('Please arrive 15 minutes before your scheduled time.')
            ->action('View appointment', route('appointments.show', $appointment));
    }
}
