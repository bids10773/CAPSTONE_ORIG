<?php

namespace App\Observers;

use App\Models\Company;
use App\Models\User;
use App\Services\WorkflowNotificationService;

class CompanyAccountNotificationObserver
{
    public function created(Company $company): void
    {
        app(WorkflowNotificationService::class)->admins('company_account_created', 'Company account created',
            'A company account was registered.', '/admin/companies/'.$company->id);
    }

    public function updated(Company $company): void
    {
        if (! $company->wasChanged(['company_name', 'email', 'contact_number', 'address', 'industry_type', 'status', 'is_partnered'])) {
            return;
        }
        $notifications = app(WorkflowNotificationService::class);
        $notifications->admins('company_account_updated', 'Company account updated',
            'A company account was updated.', '/admin/companies/'.$company->id);
        $notifications->users(User::query()->where('role', 'company')->where('company_id', $company->id)->get(),
            'company_account_updated', 'Company account updated', 'Your company account details or status were updated.', '/company/dashboard');
    }

    public function deleted(Company $company): void
    {
        app(WorkflowNotificationService::class)->admins('company_account_deleted', 'Company account removed',
            'A company account was removed.', '/admin/companies');
    }
}
