<?php

namespace App\Observers;

use App\Models\Company;
use App\Models\User;
use App\Services\WorkflowNotificationService;
use App\Support\NotificationWording as W;

class CompanyAccountNotificationObserver
{
    public function created(Company $company): void
    {
        app(WorkflowNotificationService::class)->admins('company_account_created', 'Company account created',
            'The company account for '.($company->company_name ?: 'the company').' was registered'.W::by(auth()->user()).'.', '/admin/companies/'.$company->id);
    }

    public function updated(Company $company): void
    {
        if (! $company->wasChanged(['company_name', 'email', 'contact_number', 'address', 'industry_type', 'status', 'is_partnered'])) {
            return;
        }
        $notifications = app(WorkflowNotificationService::class);
        $notifications->admins('company_account_updated', 'Company account updated',
            'The company account for '.($company->company_name ?: 'the company').' was updated'.W::by(auth()->user()).'.', '/admin/companies/'.$company->id);
        $notifications->users(User::query()->where('role', 'company')->where('company_id', $company->id)->get(),
            'company_account_updated', 'Company account updated', 'Your company account for '.($company->company_name ?: 'your company').' was updated'.W::by(auth()->user()).'.', '/company/dashboard');
    }

    public function deleted(Company $company): void
    {
        app(WorkflowNotificationService::class)->admins('company_account_deleted', 'Company account removed',
            'The company account for '.($company->company_name ?: 'the company').' was removed'.W::by(auth()->user()).'.', '/admin/companies');
    }
}
