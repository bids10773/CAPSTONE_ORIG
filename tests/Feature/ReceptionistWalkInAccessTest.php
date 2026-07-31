<?php

use App\Models\Appointment;
use App\Models\User;

function receptionist(): User
{
    return User::factory()->create(['role' => 'receptionist']);
}

test('receptionist can view the focused dashboard and walk-in queue', function () {
    $this->actingAs(receptionist())
        ->get(route('receptionist.dashboard'))
        ->assertOk();

    $this->actingAs(receptionist())
        ->get(route('receptionist.walk-ins.index'))
        ->assertOk();
});

test('receptionist can register a new patient and create a walk-in appointment', function () {
    $this->actingAs(receptionist())
        ->post(route('receptionist.walk-ins.store'), [
            'patient_type' => 'new',
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'contact' => '09123456789',
            'birthdate' => '1995-05-10',
            'sex' => 'Female',
            'civil_status' => 'Single',
            'service_types' => ['PE', 'CBC'],
            'notes' => 'Walk-in registration',
        ])
        ->assertRedirect();

    $patient = User::query()->where('first_name', 'Maria')->firstOrFail();

    expect($patient->role)->toBe('patient');
    $this->assertDatabaseHas('patient_profiles', ['user_id' => $patient->id]);
    $this->assertDatabaseHas('appointments', [
        'user_id' => $patient->id,
        'type' => 'walk_in',
        'status' => 'pending',
    ]);
});

test('receptionist can find and queue an existing patient', function () {
    $staff = receptionist();
    $patient = User::factory()->create([
        'role' => 'patient',
        'first_name' => 'Searchable',
        'last_name' => 'Patient',
    ]);

    $this->actingAs($staff)
        ->getJson(route('receptionist.patients.search', ['q' => 'Searchable']))
        ->assertOk()
        ->assertJsonFragment(['id' => $patient->id]);

    $this->actingAs($staff)
        ->post(route('receptionist.walk-ins.store'), [
            'patient_type' => 'existing',
            'user_id' => $patient->id,
            'service_types' => ['X-Ray'],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('appointments', [
        'user_id' => $patient->id,
        'type' => 'walk_in',
    ]);
});

test('receptionist can update only todays walk-in status', function () {
    $staff = receptionist();
    $patient = User::factory()->create();
    $walkIn = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => now(),
        'type' => 'walk_in',
        'status' => 'pending',
        'service_types' => ['PE'],
    ]);
    $online = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => now(),
        'type' => 'individual',
        'status' => 'pending',
        'service_types' => ['PE'],
    ]);

    $this->actingAs($staff)
        ->patch(route('receptionist.walk-ins.status', $walkIn), ['status' => 'arrived'])
        ->assertRedirect();

    expect($walkIn->refresh()->status)->toBe('arrived');

    $this->actingAs($staff)
        ->patch(route('receptionist.walk-ins.status', $online), ['status' => 'completed'])
        ->assertForbidden();

    $this->actingAs($staff)
        ->patch(route('receptionist.walk-ins.status', $walkIn), ['status' => 'for_xray'])
        ->assertSessionHasErrors('status');
});

test('receptionist is forbidden from administrative medical analytics and system routes', function (string $url) {
    $this->actingAs(receptionist())->get($url)->assertForbidden();
})->with([
    '/admin/staff',
    '/admin/companies',
    '/admin/appointments',
    '/admin/analytics',
    '/admin/forecast',
    '/admin/reports',
    '/doctor/appointments',
    '/medtech/appointments',
    '/radtech/appointments',
    '/settings/appearance',
]);

test('other roles cannot access receptionist endpoints', function () {
    $patient = User::factory()->create(['role' => 'patient']);

    $this->actingAs($patient)
        ->get(route('receptionist.walk-ins.index'))
        ->assertForbidden();

    $this->actingAs($patient)
        ->getJson(route('receptionist.patients.search', ['q' => 'patient']))
        ->assertForbidden();
});
