<?php

namespace App\Notifications;

use App\Models\DoctorAvailabilityChangeRequest;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DoctorAvailabilityChangeRequested extends Notification
{
    use Queueable;

    private readonly string $doctorLabel;

    public function __construct(private readonly DoctorAvailabilityChangeRequest $changeRequest)
    {
        $this->doctorLabel = NotificationWording::actor($changeRequest->doctor) ?? 'The doctor';
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $doctor = $this->changeRequest->doctor;

        return [
            'type' => 'doctor_availability_change_requested',
            'title' => 'Availability change requested',
            'message' => "{$this->doctorLabel} requested an availability change (request #{$this->changeRequest->id}).",
            'availability_change_request_id' => $this->changeRequest->id,
            'url' => route('admin.doctor-availability.index', [
                'doctor_id' => $this->changeRequest->doctor_id,
                'request_id' => $this->changeRequest->id,
            ], false),
        ];
    }
}
