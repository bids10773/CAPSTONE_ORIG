<?php

namespace App\Observers;

use App\Models\SecurityAudit;
use App\Models\User;
use App\Services\WorkflowNotificationService;

class StaffSecurityNotificationObserver
{
    public function created(SecurityAudit $audit): void
    {
        if ($audit->status !== 'success') {
            return;
        }
        $message = match ($audit->action) {
            'professional_license_submitted' => 'A professional license submission requires administrator review.',
            'professional_license_verified' => 'A professional license submission was verified.',
            'professional_license_rejected' => 'A professional license submission was rejected.',
            'professional_license_changed' => 'A professional license profile was changed and requires new proof.',
            'staff_account_created_credentials_sent' => 'A staff account was created.',
            'staff_account_updated' => 'A staff account was updated.',
            'staff_account_deleted' => 'A staff account was deleted.',
            'staff_account_activated' => 'A staff account was activated.',
            'staff_account_deactivated' => 'A staff account was deactivated.',
            'staff_temporary_credentials_resent' => 'Staff access credentials were resent.',
            'staff_signature_updated', 'electronic_signature_updated' => 'A staff signature was updated.',
            default => null,
        };
        if ($message === null) {
            return;
        }
        $license = str_starts_with($audit->action, 'professional_license_');
        $title = $license ? 'Professional license update' : 'Staff account update';
        $service = app(WorkflowNotificationService::class);
        $service->admins($audit->action, $title, $message,
            $audit->action === 'staff_account_deleted' ? '/admin/staff' : '/admin/staff/'.$audit->target_user_id.'/edit');
        if ($audit->target_user_id !== $audit->actor_id
            && in_array($audit->action, ['professional_license_verified', 'professional_license_rejected', 'staff_account_updated', 'staff_account_activated'], true)
            && User::query()->whereKey($audit->target_user_id)->whereIn('role', ['doctor', 'medtech', 'radtech', 'receptionist'])->exists()) {
            $service->users([$audit->target_user_id], $audit->action, $title,
                $license ? 'Your professional license review status has changed. Review your profile for details.' : 'Your staff account was updated. Review your profile for details.', '/settings/profile');
        }
    }
}
