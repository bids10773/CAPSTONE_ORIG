<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Models\SecurityAudit;
use App\Models\User;
use App\Services\WorkflowNotificationService;

class BulkReportNotificationObserver
{
    public function created(SecurityAudit $audit): void
    {
        if ($audit->status !== 'success' || ! in_array($audit->action, ['bulk_medical_report_generated', 'bulk_medical_report_released'], true)) {
            return;
        }
        $event = Appointment::find($audit->metadata['bulk_appointment_id'] ?? null);
        if (! $event?->isBulkParent()) {
            return;
        }
        $released = $audit->action === 'bulk_medical_report_released';
        $notifications = app(WorkflowNotificationService::class);
        $notifications->admins($audit->action, $released ? 'Company report released' : 'Company report ready for review',
            $released ? 'A final company report was released.' : 'A final company report was generated and is ready for review.',
            route('admin.bulk-medical-results.show', $event, false));
        if ($released && $event->company_id) {
            $notifications->users(User::where('role', 'company')->where('company_id', $event->company_id)->get(),
                $audit->action, 'Company report available', 'Your final company report is now available to download.',
                route('company.bulk-appointments.index', absolute: false));
        }
    }
}
