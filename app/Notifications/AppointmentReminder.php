<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentReminder extends Notification
{
    use Queueable;

    private readonly string $message;

    public function __construct(public readonly Appointment $appointment)
    {
        $this->message = 'The system reminds you of your '.NotificationWording::appointment($appointment).' on '.NotificationWording::schedule($appointment).'.';
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'appointment_reminder',
            'title' => 'Appointment reminder',
            'message' => $this->message,
            'appointment_id' => $this->appointment->id,
            'url' => route('appointments.show', $this->appointment, absolute: false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appointment = $this->appointment;

        return (new MailMessage)
            ->subject('Appointment reminder | Living Myth Industrial Clinic')
            ->greeting('Appointment reminder')
            ->line($this->message)
            ->line('Reference: '.$appointment->reference_code)
            ->line('Date: '.($appointment->appointment_date?->format('F j, Y') ?? 'To be confirmed'))
            ->line('Time: '.($appointment->start_time?->format('g:i A') ?? 'Please contact the clinic'))
            ->line('Doctor: '.($appointment->doctor ? 'Dr. '.$appointment->doctor->name : 'To be assigned'))
            ->line('Please arrive 15 minutes before your scheduled time.')
            ->action('View appointment', route('appointments.show', $appointment));
    }
}
