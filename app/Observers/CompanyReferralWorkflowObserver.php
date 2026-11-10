<?php

namespace App\Observers;

use App\Models\CompanyReferral;
use App\Models\User;
use App\Services\WorkflowNotificationService;
use App\Support\NotificationWording as W;

class CompanyReferralWorkflowObserver
{
    public function __construct(private readonly WorkflowNotificationService $notifications) {}

    public function created(CompanyReferral $referral): void
    {
        $this->publish($referral, true);
    }

    public function updated(CompanyReferral $referral): void
    {
        if ($referral->wasChanged('status')) {
            $this->publish($referral);
        }
    }

    private function publish(CompanyReferral $referral, bool $created = false): void
    {
        $actor = auth()->user();
        if (! $actor && $created) {
            $actor = $referral->creator;
        } elseif (! $actor && $referral->status === 'cancelled' && $referral->wasChanged('cancelled_by')) {
            $actor = $referral->cancelled_by;
        }
        $company = $referral->company?->company_name ?? 'the company';
        $by = $referral->notificationAutomaticallyUpdated ? ' by the system' : W::by($actor);
        $status = $referral->status === 'pending' ? 'awaiting invitation delivery' : W::status($referral->status);
        $message = 'Referral '.$referral->referral_number.' for '.$company.' was '.($created ? 'created' : 'marked '.$status).$by.'.';
        $this->notifications->admins('company_referral_updated', 'Company referral updated', $message, route('admin.appointments.index', ['type' => 'company_referral'], false));
        $this->notifications->users(User::where('role', 'company')->where('company_id', $referral->company_id)->get(), 'company_referral_updated', 'Company referral updated', $message, route('company.dashboard', absolute: false));
        if ($referral->patient_id) {
            $this->notifications->users(User::whereKey($referral->patient_id)->where('role', 'patient')->get(), 'company_referral_updated', 'Company referral updated', $message, route('appointments.index', absolute: false));
        }
    }
}
