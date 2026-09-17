<?php

namespace App\Notifications;

use App\Models\DoctorAvailabilityChangeRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DoctorScheduleChanged extends Notification
{
    use Queueable;

    public function __construct(
        private readonly DoctorAvailabilityChangeRequest $changeRequest,
        private readonly int $movedAppointments,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $message = "Dr. {$this->changeRequest->doctor->name}'s schedule has been changed.";
        $message .= $this->movedAppointments > 0
            ? ' The affected patient appointments have been moved accordingly.'
            : ' No existing patient appointments required moving.';

        return [
            'type' => 'doctor_schedule_changed',
            'title' => 'Doctor schedule changed',
            'message' => $message,
            'availability_change_request_id' => $this->changeRequest->id,
            'url' => route('receptionist.dashboard', absolute: false),
        ];
    }
}
