<?php

namespace App\Observers;

use App\Models\OnsiteServiceQueue;
use App\Models\User;
use App\Services\WorkflowNotificationService;
use App\Support\NotificationWording as W;

class OnsiteQueueWorkflowObserver
{
    public function __construct(private readonly WorkflowNotificationService $notifications) {}

    public function created(OnsiteServiceQueue $queue): void
    {
        if ($queue->assigned_staff_id) {
            $this->publish($queue);
        }
    }

    public function updated(OnsiteServiceQueue $queue): void
    {
        if (! $queue->wasChanged(['status', 'assigned_staff_id'])) {
            return;
        }
        $this->publish($queue);
    }

    private function publish(OnsiteServiceQueue $queue): void
    {
        $visit = $queue->appointment ? W::appointment($queue->appointment) : 'appointment #'.$queue->appointment_id;
        $context = W::service($queue->service_role).' task for '.$visit;
        $by = $queue->notificationAutomaticallyAssigned ? ' by the system' : W::by(auth()->user());
        $this->notifications->admins('onsite_queue_updated', 'Onsite queue updated', $context.' was marked '.W::status($queue->status).$by.'.', route('admin.onsite-events.show', $queue->bulk_appointment_id, false));
        $role = match ($queue->service_role) {
            'doctor', 'drug_verification', 'final_evaluation' => 'doctor',
            'medtech' => 'medtech',
            'radtech' => 'radtech',
            default => null,
        };
        if ($queue->status === 'assigned' && $queue->assigned_staff_id && $role !== null) {
            $recipients = User::whereKey($queue->assigned_staff_id)->where('role', $role)->get();
            $this->notifications->users($recipients, 'onsite_task_assigned', 'Onsite task assigned', $context.' was assigned to your onsite queue'.$by.'.', route($role.'.onsite-events.show', $queue->bulk_appointment_id, false));
        }
    }
}
