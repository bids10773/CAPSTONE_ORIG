<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentConfirmed extends Notification
{
    use Queueable;

    public function __construct(public readonly Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'appointment_confirmed',
            'title' => 'Appointment Confirmed',
            'message' => 'Your appointment for '.$this->appointment->appointment_date->format('M j, Y').' at '.$this->appointment->start_time?->format('g:i A').' has been confirmed.',
            'appointment_id' => $this->appointment->id,
            'url' => route('appointments.index', absolute: false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appointment = $this->appointment;

        return (new MailMessage)
            ->subject('Appointment Confirmed | Living Myth Industrial Clinic')
            ->greeting('Appointment Confirmed')
            ->line('Your appointment has been confirmed by the clinic.')
            ->line('Date: '.$appointment->appointment_date->format('F j, Y'))
            ->line('Time: '.$appointment->start_time?->format('g:i A'))
            ->line('Doctor: Dr. '.$appointment->doctor?->name)
            ->line('Please arrive 15 minutes before your scheduled time.')
            ->action('View Appointment', route('appointments.show', $appointment));
    }
}
