<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentAutoCancelled extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Appointment $appointment) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return $notifiable->email ? ['mail'] : [];
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
