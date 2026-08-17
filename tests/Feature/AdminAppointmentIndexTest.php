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
        'last_name' => 'Dela Cruz',
        'contact' => '09171234567',
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

    foreach (['Juan', 'Dela Cruz', 'Juan Dela Cruz', 'juan dela cruz', '09171234567'] as $search) {
        $this->actingAs($admin)
            ->get(route('admin.appointments.index', ['search' => $search]))
            ->assertInertia(fn (Assert $page) => $page->where('appointments.total', 1));
    }

    $this->actingAs($admin)
        ->get(route('admin.appointments.index', ['search' => 'zzzzzzzz']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 0)
            ->has('appointments.data', 0));
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

test('admin appointment index shows the most recently submitted appointment first by default', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);

    $older = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today()->addDays(10),
        'type' => 'individual',
        'status' => 'pending',
        'service_types' => ['CBC'],
    ]);
    $older->timestamps = false;
    $older->forceFill(['created_at' => now()->subHour()])->saveQuietly();

    $newer = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today()->addDay(),
        'type' => 'individual',
        'status' => 'pending',
        'service_types' => ['CBC'],
    ]);

    $this->actingAs($admin)->get(route('admin.appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.data.0.id', $newer->id)
            ->where('appointments.data.1.id', $older->id));
});

test('admin date filters use the scheduled appointment date and preserve all statuses', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    $make = fn (string $date, string $status) => Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => $date,
        'type' => 'individual',
        'status' => $status,
        'service_types' => ['CBC'],
    ]);

    $make(today()->toDateString(), 'accepted');
    $make(today()->toDateString(), 'rejected');
    $make(today()->addDay()->toDateString(), 'pending');
    $make(today()->addDay()->toDateString(), 'cancelled');
    $make(today()->subDay()->toDateString(), 'completed');

    $this->actingAs($admin)->get(route('admin.appointments.index', ['date_filter' => 'today']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 2));

    $this->get(route('admin.appointments.index', ['date_filter' => 'upcoming']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 2));

    $this->get(route('admin.appointments.index', ['date_filter' => 'past']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 1));
});

test('today returns zero instead of falling back to other appointment dates', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    foreach ([today()->subDay(), today()->addDay()] as $date) {
        Appointment::create([
            'user_id' => $patient->id,
            'appointment_date' => $date,
            'type' => 'individual',
            'status' => 'completed',
            'service_types' => ['CBC'],
        ]);
    }

    $this->actingAs($admin)->get(route('admin.appointments.index', ['date_filter' => 'today']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 0)
            ->has('appointments.data', 0)
            ->where('filters.date_filter', 'today'));
});

test('search date and status filters combine using and conditions', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $juan = User::factory()->create(['role' => 'patient', 'first_name' => 'Juan', 'last_name' => 'Today']);
    $other = User::factory()->create(['role' => 'patient', 'first_name' => 'Maria', 'last_name' => 'Other']);
    $make = fn (User $user, string $date, string $status) => Appointment::create([
        'user_id' => $user->id, 'appointment_date' => $date, 'type' => 'individual',
        'status' => $status, 'service_types' => ['CBC'],
    ]);
    $match = $make($juan, today()->toDateString(), 'pending');
    $make($juan, today()->addDay()->toDateString(), 'pending');
    $make($juan, today()->toDateString(), 'completed');
    $make($other, today()->toDateString(), 'pending');

    $this->actingAs($admin)->get(route('admin.appointments.index', [
        'search' => 'Juan', 'date_filter' => 'today', 'status' => 'pending',
    ]))->assertInertia(fn (Assert $page) => $page
        ->where('appointments.total', 1)
        ->where('appointments.data.0.id', $match->id));
});
