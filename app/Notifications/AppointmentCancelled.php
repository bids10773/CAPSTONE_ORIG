<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentCancelled extends Notification
{
    use Queueable;

    public function __construct(public readonly Appointment $appointment) {}

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
            'message' => 'Your appointment for '.$this->appointment->appointment_date->format('M j, Y').' was cancelled by the clinic.',
            'appointment_id' => $this->appointment->id,
            'url' => route('appointments.index', absolute: false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Appointment Cancelled | Living Myth Industrial Clinic')
            ->greeting('Hello '.$notifiable->first_name.',')
            ->line('Your appointment on '.$this->appointment->appointment_date->format('F j, Y').' at '.$this->appointment->start_time?->format('g:i A').' was cancelled by the clinic.')
            ->line('Please contact the clinic if you need assistance or book another available appointment.')
            ->action('View Appointments', route('appointments.index'));
    }
}
