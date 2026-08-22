<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin dashboard separates regular and company activity', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    $company = Company::create(['company_name' => 'Dashboard Company', 'status' => 'active']);

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

    $this->actingAs($admin)->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->where('recentAppointments.0.id', $regular->id)
            ->has('recentAppointments', 1)
            ->where('recentCompanyAppointments.0.id', $companyAppointment->id)
            ->where('recentCompanyAppointments.0.status', 'arrived')
            ->has('recentCompanyAppointments', 1));
});
