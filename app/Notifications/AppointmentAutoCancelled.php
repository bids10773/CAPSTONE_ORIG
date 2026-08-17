<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentAutoCancelled extends Notification
{
    use Queueable;

    public function __construct(private readonly Appointment $appointment) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return $notifiable->email ? ['database', 'mail'] : ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'appointment_cancelled',
            'title' => 'Appointment Cancelled',
            'message' => 'Your appointment for '.$this->appointment->appointment_date->format('M j, Y').' was cancelled because the check-in grace period elapsed.',
            'appointment_id' => $this->appointment->id,
            'url' => route('appointments.index', absolute: false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Appointment slot released')
            ->greeting('Hello '.$notifiable->first_name.',')
            ->line('Your appointment on '.$this->appointment->appointment_date->format('F j, Y').' was cancelled because you were not checked in within 10 minutes of the scheduled time.')
            ->line('Please contact the clinic or book the next available appointment.');
    }
}
