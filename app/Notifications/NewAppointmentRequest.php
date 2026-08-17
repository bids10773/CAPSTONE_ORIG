<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewAppointmentRequest extends Notification
{
    use Queueable;

    public function __construct(private readonly Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $appointment = $this->appointment->loadMissing('user');

        return [
            'type' => 'appointment_request',
            'title' => 'New Appointment Request',
            'message' => $appointment->user->name.' requested an appointment for '.$appointment->appointment_date->format('M j, Y').' at '.$appointment->start_time?->format('g:i A').'.',
            'appointment_id' => $appointment->id,
            'url' => route('admin.appointments.index', ['status' => 'pending', 'type' => 'individual'], false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appointment = $this->appointment->loadMissing('user');

        return (new MailMessage)
            ->subject('New appointment request awaiting review')
            ->greeting('New individual appointment request')
            ->line($appointment->user->name.' requested an appointment on '.$appointment->appointment_date->format('F j, Y').'.')
            ->line('The requested slot is reserved until the request is approved or rejected.')
            ->action('Review request', route('admin.appointments.index', ['status' => 'pending', 'type' => 'individual']));
    }
}
