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
            ->where('patients.data.0.is_online', true)
            ->where('patients.data.0.contact', '09171234567')
            ->where('patients.data.0.profile.address', 'Quezon City')
            ->where('patients.data.1.id', $offlinePatient->id)
            ->where('patients.data.1.is_online', false));
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
