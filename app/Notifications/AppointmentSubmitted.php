<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AppointmentSubmitted extends Notification
{
    use Queueable;

    public function __construct(private readonly Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'appointment_submitted',
            'title' => 'Appointment Request Submitted',
            'message' => 'Your appointment request for '.$this->appointment->appointment_date->format('M j, Y').' at '.$this->appointment->start_time?->format('g:i A').' is waiting for clinic approval.',
            'appointment_id' => $this->appointment->id,
            'url' => route('appointments.index', absolute: false),
        ];
    }
}
