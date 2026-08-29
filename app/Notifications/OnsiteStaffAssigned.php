<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OnsiteStaffAssigned extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Appointment $event,
        private readonly string $role,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $event = $this->event->loadMissing('company');

        return [
            'type' => 'onsite_staff_assigned',
            'title' => 'Onsite Event Assignment',
            'message' => sprintf(
                'You were assigned as %s for %s on %s.',
                $this->roleLabel(),
                $event->company?->company_name ?? 'a company onsite event',
                $event->appointment_date->format('M j, Y'),
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
