<?php

namespace App\Notifications;

use App\Models\DoctorAvailabilityChangeRequest;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DoctorScheduleChanged extends Notification
{
    use Queueable;

    private readonly string $doctorLabel;

    private readonly string $actorSuffix;

    public function __construct(
        private readonly DoctorAvailabilityChangeRequest $changeRequest,
        private readonly int $movedAppointments,
    ) {
        $this->doctorLabel = NotificationWording::actor($changeRequest->doctor) ?? 'the doctor';
        $this->actorSuffix = NotificationWording::by($changeRequest->reviewed_by);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $message = "The schedule for {$this->doctorLabel} was changed{$this->actorSuffix} after availability request #{$this->changeRequest->id} was approved.";
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
