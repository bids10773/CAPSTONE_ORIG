<?php

namespace App\Observers;

use App\Models\OnsiteEventStaff;
use App\Models\User;
use App\Services\WorkflowNotificationService;

class OnsiteStaffWorkflowObserver
{
    public function __construct(private readonly WorkflowNotificationService $notifications) {}

    public function created(OnsiteEventStaff $deployment): void
    {
        $this->publish($deployment);
    }

    public function updated(OnsiteEventStaff $deployment): void
    {
        if ($deployment->wasChanged(['is_active', 'queue_capacity'])) {
            $this->publish($deployment);
        }
    }

    private function publish(OnsiteEventStaff $deployment): void
    {
        $this->notifications->admins('onsite_staff_updated', 'Onsite staffing updated', 'An onsite staff deployment was updated.', route('admin.onsite-events.show', $deployment->bulk_appointment_id, false));
        if (! $deployment->is_active) {
            $this->notifications->users(User::whereKey($deployment->user_id)->where('role', $deployment->service_role)->get(), 'onsite_assignment_removed', 'Onsite assignment removed', 'You were removed from an onsite event assignment.', route($deployment->service_role.'.onsite-events.index', absolute: false));
        }
    }
}
