<?php

namespace App\Observers;

use App\Models\OnsiteEventStaff;
use App\Models\User;
use App\Services\WorkflowNotificationService;
use App\Support\NotificationWording as W;

class OnsiteStaffWorkflowObserver
{
    public function __construct(private readonly WorkflowNotificationService $notifications) {}

    public function created(OnsiteEventStaff $deployment): void
    {
        $this->publish($deployment, true);
    }

    public function updated(OnsiteEventStaff $deployment): void
    {
        if ($deployment->wasChanged(['is_active', 'queue_capacity'])) {
            $this->publish($deployment);
        }
    }

    private function publish(OnsiteEventStaff $deployment, bool $created = false): void
    {
        $event = $deployment->bulkAppointment?->reference_code ?? '#'.$deployment->bulk_appointment_id;
        $actor = auth()->user() ?? ($created ? User::find($deployment->assigned_by) : null);
        $by = W::by($actor);
        $action = ! $deployment->is_active ? 'removed' : ($created ? 'assigned' : 'updated');
        $this->notifications->admins('onsite_staff_updated', 'Onsite staffing updated', 'The '.W::role($deployment->service_role).' deployment for '.W::person($deployment->user, 'the staff member').' at company event '.$event.' was '.$action.$by.'.', route('admin.onsite-events.show', $deployment->bulk_appointment_id, false));
        if (! $deployment->is_active) {
            $this->notifications->users(User::whereKey($deployment->user_id)->where('role', $deployment->service_role)->get(), 'onsite_assignment_removed', 'Onsite assignment removed', 'You were removed from your '.W::role($deployment->service_role).' assignment for company event '.$event.$by.'.', route($deployment->service_role.'.onsite-events.index', absolute: false));
        }
    }
}
