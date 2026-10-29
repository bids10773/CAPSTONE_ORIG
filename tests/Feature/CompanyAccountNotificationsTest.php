<?php

use App\Models\Company;
use App\Models\User;

test('company account changes notify admins and only that company without duplicate unchanged saves', function () {
    $company = Company::create(['company_name' => 'First Company', 'status' => 'active']);
    $otherCompany = Company::create(['company_name' => 'Other Company', 'status' => 'active']);
    $admin = User::factory()->create(['role' => 'admin']);
    $owner = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $other = User::factory()->create(['role' => 'company', 'company_id' => $otherCompany->id]);
    $company->update(['company_name' => 'Updated Company']);
    $company->update(['company_name' => 'Updated Company']);
    expect($admin->notifications()->where('data->type', 'company_account_updated')->count())->toBe(1)
        ->and($owner->notifications()->where('data->type', 'company_account_updated')->count())->toBe(1)
        ->and($other->notifications()->count())->toBe(0);
});
