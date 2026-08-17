<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AppointmentAssigned extends Notification
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
            'type' => 'appointment_assigned',
            'title' => 'New Appointment Assigned',
            'message' => 'A patient appointment has been assigned to you for '.$this->appointment->appointment_date->format('M j, Y').' at '.$this->appointment->start_time?->format('g:i A').'.',
            'appointment_id' => $this->appointment->id,
            'url' => route('doctor.appointments', ['search' => $this->appointment->user?->name], false),
        ];
    }
}
