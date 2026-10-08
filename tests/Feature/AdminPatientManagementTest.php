<?php

use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can view patient details and current presence', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $onlinePatient = User::factory()->create([
        'role' => 'patient',
        'first_name' => 'Online',
        'last_name' => 'Patient',
        'contact' => '09171234567',
    ]);
    $offlinePatient = User::factory()->create([
        'role' => 'patient',
        'first_name' => 'Offline',
        'last_name' => 'Patient',
        'password' => null,
    ]);

    PatientProfile::create([
        'user_id' => $onlinePatient->id,
        'birthdate' => '1995-04-12',
        'sex' => 'Female',
        'civil_status' => 'Single',
        'address' => 'Quezon City',
        'employee_number' => 'EMP-100',
    ]);

    DB::table('sessions')->insert([
        'id' => 'online-patient-session',
        'user_id' => $onlinePatient->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Feature test',
        'payload' => '',
        'last_activity' => now()->timestamp,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.patients.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/patients/index')
            ->has('patients.data', 2)
            ->where('patients.data.0.id', $onlinePatient->id)
            ->where('patients.data.0.patient_reference_code', $onlinePatient->patient_reference_code)
            ->where('patients.data.0.is_online', true)
            ->where('patients.data.0.has_account', true)
            ->where('patients.data.0.contact', '09171234567')
            ->where('patients.data.0.profile.address', 'Quezon City')
            ->where('patients.data.0.days_since_active', 0)
            ->where('patients.data.1.id', $offlinePatient->id)
            ->where('patients.data.1.has_account', false)
            ->where('patients.data.1.is_online', false));
});

test('admin can find a patient by permanent PAT reference', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    User::factory()->create(['role' => 'patient']);

    $this->actingAs($admin)
        ->get(route('admin.patients.index', ['search' => $patient->patient_reference_code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('patients.data', 1)
            ->where('patients.data.0.id', $patient->id)
            ->where('patients.data.0.patient_reference_code', $patient->patient_reference_code));
});

test('admin can automatically filter patients by search and presence', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->create([
        'role' => 'patient',
        'first_name' => 'Maria',
        'last_name' => 'Santos',
    ]);
    User::factory()->create([
        'role' => 'patient',
        'first_name' => 'Juan',
        'last_name' => 'Cruz',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.patients.index', [
            'search' => 'Maria Santos',
            'presence' => 'offline',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('patients.data', 1)
            ->where('patients.data.0.first_name', 'Maria')
            ->where('patients.data.0.last_name', 'Santos')
            ->where('patients.data.0.is_online', false)
            ->where('filters.search', 'Maria Santos')
            ->where('filters.presence', 'offline'));
});

test('admin can filter patients by active days', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $recent = User::factory()->create([
        'role' => 'patient',
        'first_name' => 'Recently',
        'last_name' => 'Active',
        'last_active_at' => now()->subDays(3),
    ]);
    User::factory()->create([
        'role' => 'patient',
        'first_name' => 'Long',
        'last_name' => 'Inactive',
        'last_active_at' => now()->subDays(45),
    ]);
    User::factory()->create([
        'role' => 'patient',
        'first_name' => 'Never',
        'last_name' => 'Active',
        'last_active_at' => null,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.patients.index', ['active_days' => '7']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('patients.data', 1)
            ->where('patients.data.0.id', $recent->id)
            ->where('patients.data.0.days_since_active', 3)
            ->where('filters.active_days', '7'));

    $this->get(route('admin.patients.index', ['active_days' => 'inactive_30']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('patients.data', 1)
            ->where('patients.data.0.first_name', 'Long'));

    $this->get(route('admin.patients.index', ['active_days' => 'never']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('patients.data', 1)
            ->where('patients.data.0.first_name', 'Never'));
});

test('authenticated patient activity is persisted outside the session table', function () {
    $patient = User::factory()->create([
        'role' => 'patient',
        'last_active_at' => null,
    ]);

    $this->actingAs($patient)->get(route('profile.edit'))->assertOk();

    expect($patient->refresh()->last_active_at)->not->toBeNull();
});
