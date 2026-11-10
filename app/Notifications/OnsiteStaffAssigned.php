<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\User;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OnsiteStaffAssigned extends Notification
{
    use Queueable;

    private readonly string $actorSuffix;

    public function __construct(
        private readonly Appointment $event,
        private readonly string $role,
        User|int|null $actor = null,
    ) {
        $this->actorSuffix = NotificationWording::by($actor);
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $event = $this->event->loadMissing('company');

        return [
            'type' => 'onsite_staff_assigned',
            'title' => 'Onsite event assignment',
            'message' => sprintf(
                'You were assigned as %s for %s, %s on %s%s.',
                $this->roleLabel(),
                $event->company?->company_name ?? 'a company onsite event',
                NotificationWording::appointment($event),
                NotificationWording::schedule($event),
                $this->actorSuffix,
            ),
            'appointment_id' => $event->id,
            'url' => route($this->role.'.onsite-events.show', $event, false),
        ];
    }

    private function roleLabel(): string
    {
        return match ($this->role) {
            'doctor' => 'Doctor',
            'medtech' => 'Medical Technologist',
            'radtech' => 'Radiologic Technologist',
            'receptionist' => 'Receptionist',
            default => 'Staff',
        };
    }
}
