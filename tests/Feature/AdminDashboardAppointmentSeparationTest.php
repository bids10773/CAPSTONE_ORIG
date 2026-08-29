<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin dashboard separates individual and referred patients from company bulk employees', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    $company = Company::create(['company_name' => 'Dashboard Company', 'status' => 'active']);
    $companyUser = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);

    $regular = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['CBC'],
    ]);
    $companyAppointment = Appointment::create([
        'user_id' => $patient->id,
        'company_id' => $company->id,
        'appointment_date' => today(),
        'type' => 'company_referral',
        'status' => 'arrived',
        'service_types' => ['CBC'],
    ]);
    $bulkEvent = Appointment::create([
        'user_id' => $companyUser->id,
        'company_id' => $company->id,
        'appointment_date' => today(),
        'type' => 'company_bulk',
        'status' => 'accepted',
        'service_types' => ['CBC'],
    ]);
    $bulkEmployee = Appointment::create([
        'user_id' => $patient->id,
        'company_id' => $company->id,
        'bulk_appointment_id' => $bulkEvent->id,
        'appointment_date' => today(),
        'type' => 'company_bulk',
        'status' => 'arrived',
        'service_types' => ['CBC'],
    ]);

    $this->actingAs($admin)->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->where('recentAppointments.0.id', $companyAppointment->id)
            ->where('recentAppointments.1.id', $regular->id)
            ->has('recentAppointments', 2)
            ->where('recentBulkEmployees.0.id', $bulkEmployee->id)
            ->where('recentBulkEmployees.0.status', 'arrived')
            ->has('recentBulkEmployees', 1)
            ->where('stats.todayAppointments', 2)
            ->where('stats.todayBulkEmployees', 1)
            ->where('bulkSummary.events', 1)
            ->where('bulkSummary.employees', 1));
});
