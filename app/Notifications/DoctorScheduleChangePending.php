<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\DoctorAvailabilityChangeRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DoctorScheduleChangePending extends Notification
{
    use Queueable;

    public function __construct(
        private readonly DoctorAvailabilityChangeRequest $changeRequest,
        private readonly Appointment $appointment,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'doctor_schedule_change_pending',
            'title' => 'Possible appointment schedule change',
            'message' => "Dr. {$this->changeRequest->doctor->name} requested to change their schedule. Your affected appointment may be moved if the request is accepted by the administrator.",
            'appointment_id' => $this->appointment->id,
            'availability_change_request_id' => $this->changeRequest->id,
            'url' => route('appointments.index', absolute: false),
        ];
    }
}
