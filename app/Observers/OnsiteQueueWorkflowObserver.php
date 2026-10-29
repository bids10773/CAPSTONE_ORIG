<?php

namespace App\Observers;

use App\Models\OnsiteServiceQueue;
use App\Models\User;
use App\Services\WorkflowNotificationService;

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
        $this->notifications->admins('onsite_queue_updated', 'Onsite queue updated', "An onsite service task is {$queue->status}.", route('admin.onsite-events.show', $queue->bulk_appointment_id, false));
        $role = match ($queue->service_role) {
            'doctor', 'drug_verification', 'final_evaluation' => 'doctor',
            'medtech' => 'medtech',
            'radtech' => 'radtech',
            default => null,
        };
        if ($queue->status === 'assigned' && $queue->assigned_staff_id && $role !== null) {
            $recipients = User::whereKey($queue->assigned_staff_id)->where('role', $role)->get();
            $this->notifications->users($recipients, 'onsite_task_assigned', 'Onsite task assigned', 'A patient is ready in your onsite service queue.', route($role.'.onsite-events.show', $queue->bulk_appointment_id, false));
        }
    }
}
