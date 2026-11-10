<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\User;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AppointmentSubmitted extends Notification
{
    use Queueable;

    private readonly string $message;

    public function __construct(private readonly Appointment $appointment, User|int|null $actor = null)
    {
        $this->message = 'Your appointment request '.$appointment->reference_code.' for '.NotificationWording::schedule($appointment).' was submitted'.NotificationWording::by($actor).' and is awaiting clinic approval.';
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'appointment_submitted',
            'title' => 'Appointment request submitted',
            'message' => $this->message,
            'appointment_id' => $this->appointment->id,
            'url' => route('appointments.index', absolute: false),
        ];
    }
}
