<?php

namespace App\Observers;

use App\Models\SecurityAudit;
use App\Models\User;
use App\Services\WorkflowNotificationService;
use App\Support\NotificationWording as W;

class StaffSecurityNotificationObserver
{
    public function created(SecurityAudit $audit): void
    {
        if ($audit->status !== 'success') {
            return;
        }
        $target = W::person($audit->targetUser, 'The affected staff member');
        $by = W::by($audit->actor);
        [$title, $subject, $verb] = match ($audit->action) {
            'professional_license_submitted' => ['Professional license submitted', 'professional license', 'was submitted for administrator review'],
            'professional_license_verified' => ['Professional license verified', 'professional license', 'was verified'],
            'professional_license_rejected' => ['Professional license rejected', 'professional license', 'was rejected'],
            'professional_license_changed' => ['Professional license changed', 'professional license profile', 'was changed'],
            'staff_account_created_credentials_sent' => ['Staff account created', 'staff account', 'was created'],
            'staff_account_updated' => ['Staff account updated', 'staff account', 'was updated'],
            'staff_account_deleted' => ['Staff account deleted', 'staff account', 'was deleted'],
            'staff_account_activated' => ['Staff account activated', 'staff account', 'was activated'],
            'staff_account_deactivated' => ['Staff account deactivated', 'staff account', 'was deactivated'],
            'staff_temporary_credentials_resent' => ['Staff credentials resent', 'access credentials', 'were resent'],
            'staff_signature_updated', 'electronic_signature_updated' => ['Staff signature updated', 'signature', 'was updated'],
            default => [null, null, null],
        };
        if ($title === null) {
            return;
        }
        $message = "{$target}'s {$subject} {$verb}{$by}.".match ($audit->action) {
            'professional_license_changed' => ' New proof is required.',
            'staff_account_created_credentials_sent' => ' Access credentials were sent.',
            default => '',
        };
        $service = app(WorkflowNotificationService::class);
        $service->admins($audit->action, $title, $message,
            $audit->action === 'staff_account_deleted' ? '/admin/staff' : '/admin/staff/'.$audit->target_user_id.'/edit');
        if ($audit->target_user_id !== $audit->actor_id
            && in_array($audit->action, ['professional_license_verified', 'professional_license_rejected', 'staff_account_updated', 'staff_account_activated'], true)
            && User::query()->whereKey($audit->target_user_id)->whereIn('role', ['doctor', 'medtech', 'radtech', 'receptionist'])->exists()) {
            $service->users([$audit->target_user_id], $audit->action, $title,
                "Your {$subject} {$verb}{$by}.".($audit->action === 'professional_license_rejected' ? ' Review your profile for details.' : ''), '/settings/profile');
        }
    }
}
