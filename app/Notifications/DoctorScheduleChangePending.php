<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\DoctorAvailabilityChangeRequest;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DoctorScheduleChangePending extends Notification
{
    use Queueable;

    private readonly string $doctorLabel;

    public function __construct(
        private readonly DoctorAvailabilityChangeRequest $changeRequest,
        private readonly Appointment $appointment,
    ) {
        $this->doctorLabel = NotificationWording::actor($changeRequest->doctor) ?? 'The doctor';
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'doctor_schedule_change_pending',
            'title' => 'Possible appointment schedule change',
            'message' => "{$this->doctorLabel} requested a schedule change (request #{$this->changeRequest->id}). Your ".NotificationWording::appointment($this->appointment).' for '.NotificationWording::schedule($this->appointment).' may be moved if an administrator approves the request.',
            'appointment_id' => $this->appointment->id,
            'availability_change_request_id' => $this->changeRequest->id,
            'url' => route('appointments.index', absolute: false),
        ];
    }
}
