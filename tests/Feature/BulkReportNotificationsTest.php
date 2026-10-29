<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\SecurityAudit;
use App\Models\User;

test('bulk report review and release alerts reach admins and only the owning company', function () {
    $company = Company::create(['company_name' => 'Report Owner']);
    $otherCompany = Company::create(['company_name' => 'Other Company']);
    $admin = User::factory()->create(['role' => 'admin']);
    $owner = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $other = User::factory()->create(['role' => 'company', 'company_id' => $otherCompany->id]);
    $patient = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);
    $event = Appointment::create([
        'user_id' => $owner->id, 'company_id' => $company->id,
        'appointment_date' => today(), 'type' => 'company_bulk', 'status' => 'accepted',
        'service_types' => ['CBC'], 'service_location' => 'onsite',
    ]);
    $publish = fn (string $action) => SecurityAudit::create([
        'actor_id' => $admin->id, 'action' => $action, 'status' => 'success',
        'metadata' => ['bulk_appointment_id' => $event->id, 'report_id' => 1],
    ]);
    $publish('bulk_medical_report_generated');
    expect($admin->notifications()->where('data->type', 'bulk_medical_report_generated')->count())->toBe(1)
        ->and($owner->notifications()->where('data->type', 'bulk_medical_report_generated')->count())->toBe(0);
    $publish('bulk_medical_report_released');
    expect($admin->notifications()->where('data->type', 'bulk_medical_report_released')->count())->toBe(1)
        ->and($owner->notifications()->where('data->type', 'bulk_medical_report_released')->count())->toBe(1)
        ->and($other->notifications()->where('data->type', 'bulk_medical_report_released')->count())->toBe(0)
        ->and($patient->notifications()->where('data->type', 'bulk_medical_report_released')->count())->toBe(0);
});
