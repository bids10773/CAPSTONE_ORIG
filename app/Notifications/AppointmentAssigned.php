<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\User;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AppointmentAssigned extends Notification
{
    use Queueable;

    private readonly string $message;

    public function __construct(private readonly Appointment $appointment, User|int|null $actor = null)
    {
        $this->message = 'The '.NotificationWording::appointment($appointment).' for '.NotificationWording::person($appointment->user, 'the patient').' on '.NotificationWording::schedule($appointment).' was assigned to you'.NotificationWording::by($actor).'.';
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'appointment_assigned',
            'title' => 'Appointment assigned',
            'message' => $this->message,
            'appointment_id' => $this->appointment->id,
            'url' => route('doctor.appointments', ['search' => $this->appointment->user?->name], false),
        ];
    }
}
