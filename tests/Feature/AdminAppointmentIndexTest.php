<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin appointment index searches relationships and applies validated server filters', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'first_name' => 'Elena',
        'last_name' => 'Rivera',
        'is_active' => true,
    ]);
    $company = Company::create([
        'company_name' => 'Northstar Manufacturing',
        'status' => 'active',
    ]);
    $patient = User::factory()->create([
        'role' => 'patient',
        'first_name' => 'Juan',
        'middle_name' => 'Miguel',
        'last_name' => 'Cruz',
    ]);

    Appointment::create([
        'user_id' => $patient->id,
        'company_id' => $company->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today()->addDay()->setTime(10, 30),
        'start_time' => '10:30',
        'end_time' => '11:00',
        'type' => 'company_referral',
        'status' => 'for_diagnostics',
        'service_types' => ['PE', 'X-Ray'],
        'referral_code' => 'REF-NORTH-001',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.appointments.index', [
            'search' => 'NORTH',
            'status' => 'for_diagnostics',
            'type' => 'company_referral',
            'date_filter' => 'upcoming',
            'doctor_id' => $doctor->id,
            'company_id' => $company->id,
            'sort' => 'appointment_date',
            'direction' => 'desc',
            'per_page' => 10,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/appointments/index')
            ->where('appointments.total', 1)
            ->where('appointments.data.0.referral_code', 'REF-NORTH-001')
            ->where('appointments.data.0.doctor.id', $doctor->id)
            ->where('appointments.data.0.company.id', $company->id)
            ->where('filters.status', 'for_diagnostics')
            ->has('doctors', 1)
            ->has('companies', 1));

    $this->actingAs($admin)
        ->get(route('admin.appointments.index', ['search' => 'Miguel']))
        ->assertInertia(fn (Assert $page) => $page->where('appointments.total', 1));
});

test('admin appointment index rejects unsupported workflow filters and sorting', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->from(route('admin.appointments.index'))
        ->get(route('admin.appointments.index', [
            'status' => 'pending_diagnostics',
            'sort' => 'drop_table',
            'direction' => 'sideways',
        ]))
        ->assertRedirect(route('admin.appointments.index'))
        ->assertSessionHasErrors(['status', 'sort', 'direction']);
});
