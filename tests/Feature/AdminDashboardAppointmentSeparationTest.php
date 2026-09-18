<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\SecurityAudit;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin dashboard separates individual and referred patients from company bulk employees', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    $company = Company::create(['company_name' => 'Dashboard Company', 'status' => 'active']);
    $companyUser = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);

    $regular = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today()->addDay(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['CBC'],
        'examination_purpose' => 'annual_pe',
    ]);
    $companyAppointment = Appointment::create([
        'user_id' => $patient->id,
        'company_id' => $company->id,
        'appointment_date' => today(),
        'type' => 'company_referral',
        'status' => 'arrived',
        'service_types' => ['CBC'],
        'examination_purpose' => 'annual_pe',
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
            ->where('upcomingAppointments.0.id', $regular->id)
            ->where('upcomingAppointments.0.status', 'accepted')
            ->has('upcomingAppointments', 1)
            ->where('partnerCompanies.0.company_name', 'Dashboard Company')
            ->has('partnerCompanies', 1)
            ->where('serviceSelections.0.service', 'CBC')
            ->where('serviceSelections.0.count', 2)
            ->has('serviceSelections', 1)
            ->where('examinationPurposes.0.purpose', 'annual_pe')
            ->where('examinationPurposes.0.count', 2)
            ->has('examinationPurposes', 1)
            ->where('stats.todayAppointments', 1)
            ->where('stats.todayBulkEmployees', 1)
            ->where('bulkSummary.events', 1)
            ->missing('appointmentsByType')
            ->where('bulkSummary.employees', 1));
});

test('admin security page shows booking and security alert counts', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    SecurityAudit::create([
        'action' => 'possible_duplicate_account',
        'status' => 'review',
        'metadata' => [],
    ]);
    SecurityAudit::create([
        'action' => 'rapid_booking_attempts',
        'status' => 'review',
        'metadata' => [],
    ]);
    SecurityAudit::create([
        'action' => 'repeated_cancellation',
        'status' => 'resolved',
        'metadata' => [],
    ]);

    $this->actingAs($admin)->get(route('admin.security'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/reports')
            ->where('securityAlerts.possibleDuplicateAccounts', 1)
            ->where('securityAlerts.repeatedBookingAttempts', 1)
            ->where('securityAlerts.highCancellationActivity', 0)
            ->has('securityLogs.data', 3)
            ->where('securityLogs.data.0.action', 'repeated_cancellation')
            ->where('securityLogs.data.0.actor', 'System')
            ->missing('securityLogs.data.0.metadata'));
});

test('admin security logs show actors and targets with pagination', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);

    for ($index = 0; $index < 16; $index++) {
        SecurityAudit::create([
            'actor_id' => $admin->id,
            'target_user_id' => $patient->id,
            'action' => 'appointment_checked_in',
            'status' => 'success',
            'metadata' => ['private' => 'not shown in the log'],
        ]);
    }

    $this->actingAs($admin)->get(route('admin.security'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('securityLogs.data', 15)
            ->where('securityLogs.total', 16)
            ->where('securityLogs.data.0.actor', $admin->name)
            ->where('securityLogs.data.0.target', $patient->name)
            ->missing('securityLogs.data.0.metadata'));

    $this->actingAs($admin)->get(route('admin.security', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('securityLogs.data', 1)
            ->where('securityLogs.current_page', 2));
});
