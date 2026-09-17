<?php

namespace App\Notifications;

use App\Models\DoctorAvailabilityChangeRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DoctorAvailabilityChangeRequested extends Notification
{
    use Queueable;

    public function __construct(private readonly DoctorAvailabilityChangeRequest $changeRequest) {}

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
            'message' => "Dr. {$doctor->name} requested to change their availability.",
            'availability_change_request_id' => $this->changeRequest->id,
            'url' => route('admin.doctor-availability.index', [
                'doctor_id' => $doctor->id,
                'request_id' => $this->changeRequest->id,
            ], false),
        ];
    }
}
