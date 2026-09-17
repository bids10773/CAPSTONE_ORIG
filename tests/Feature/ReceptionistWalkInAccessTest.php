<?php

use App\Models\Appointment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

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

test('receptionist dashboard includes todays active online queue only', function () {
    $patient = User::factory()->create(['role' => 'patient', 'first_name' => 'Online']);
    Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'start_time' => '09:30',
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['PE', 'Pregnancy Test'],
    ]);
    Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today()->addDay(),
        'type' => 'individual',
        'status' => 'pending',
        'service_types' => ['CBC'],
    ]);

    $this->actingAs(receptionist())
        ->get(route('receptionist.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('receptionist/dashboard')
            ->where('metrics.online', 1)
            ->has('onlineQueue', 1)
            ->where('onlineQueue.0.patient_name', fn (string $name): bool => str_contains($name, 'Online'))
            ->where('onlineQueue.0.services', ['PE', 'Pregnancy Test']));
});

test('online appointments have priority and receptionist cannot manually cancel them', function () {
    $this->travelTo(today()->setTime(9, 0));
    $patient = User::factory()->create(['role' => 'patient']);
    $walkIn = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'walk_in',
        'status' => 'pending',
        'service_types' => ['CBC'],
    ]);
    $online = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'start_time' => '10:00',
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['PE'],
    ]);
    $staff = receptionist();

    $this->actingAs($staff)
        ->get(route('receptionist.queue.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('walkIns.data.0.id', $online->id)
            ->where('walkIns.data.0.queue_number', 'O-001')
            ->where('walkIns.data.1.id', $walkIn->id)
            ->where('walkIns.data.1.queue_number', 'W-001'));

    $this->actingAs($staff)
        ->patch(route('receptionist.walk-ins.status', $online), ['status' => 'cancelled'])
        ->assertSessionHasErrors('status');

    expect($online->refresh()->status)->toBe('accepted');
});

test('opening the receptionist queue releases a late online slot to the earliest waiting walk in', function () {
    $this->travelTo(today()->setTime(9, 11));
    $patient = User::factory()->create(['role' => 'patient']);
    $online = Appointment::create([
        'user_id' => $patient->id, 'appointment_date' => today(),
        'start_time' => '09:00', 'end_time' => '09:30', 'type' => 'individual',
        'status' => 'accepted', 'service_types' => ['PE'],
    ]);
    $walkIn = Appointment::create([
        'user_id' => $patient->id, 'appointment_date' => today(),
        'type' => 'walk_in', 'status' => 'pending', 'arrived_at' => today()->setTime(8, 45),
        'service_types' => ['CBC'],
    ]);

    $this->actingAs(receptionist())->get(route('receptionist.queue.index'))->assertOk();

    expect($online->refresh()->status)->toBe('cancelled')
        ->and($walkIn->refresh()->released_from_appointment_id)->toBe($online->id)
        ->and($walkIn->start_time->format('H:i'))->toBe('09:00');
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
            'examination_purpose' => 'pre_employment',
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

test('receptionist cannot register an annual exam as a walk in', function () {
    $patient = User::factory()->create(['role' => 'patient']);

    $this->actingAs(receptionist())
        ->post(route('receptionist.walk-ins.store'), [
            'patient_type' => 'existing',
            'user_id' => $patient->id,
            'examination_purpose' => 'annual_pe',
            'service_types' => ['PE'],
        ])
        ->assertSessionHasErrors('examination_purpose');

    $this->assertDatabaseMissing('appointments', [
        'user_id' => $patient->id,
        'type' => 'walk_in',
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
            'examination_purpose' => 'medical_clearance',
            'service_types' => ['X-Ray'],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('appointments', [
        'user_id' => $patient->id,
        'type' => 'walk_in',
    ]);
});

test('receptionist assigns a doctor only in a free slot that does not overlap an online appointment', function () {
    $this->travelTo('2026-09-18 08:15:00');
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'availability' => [['day' => 'fri', 'start' => '08:00', 'end' => '11:00']],
    ]);
    $patient = User::factory()->create(['role' => 'patient']);
    $onlinePatient = User::factory()->create(['role' => 'patient']);
    Appointment::create([
        'user_id' => $onlinePatient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
        'start_time' => '09:00',
        'end_time' => '09:30',
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['PE'],
    ]);

    $this->actingAs(receptionist())->get(route('receptionist.walk-ins.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('availableDoctors.0.id', $doctor->id)
            ->where('availableDoctors.0.slots', fn ($slots): bool => $slots->contains('08:30') && ! $slots->contains('09:00')));

    $registration = [
        'patient_type' => 'existing',
        'user_id' => $patient->id,
        'examination_purpose' => 'medical_clearance',
        'service_types' => ['PE'],
        'doctor_id' => $doctor->id,
    ];
    $this->post(route('receptionist.walk-ins.store'), [...$registration, 'start_time' => '09:00'])
        ->assertSessionHasErrors('start_time');
    $this->assertDatabaseMissing('appointments', ['user_id' => $patient->id, 'type' => 'walk_in']);

    $this->post(route('receptionist.walk-ins.store'), [...$registration, 'start_time' => '08:30'])
        ->assertRedirect();
    $walkIn = Appointment::query()->where('user_id', $patient->id)->where('type', 'walk_in')->firstOrFail();
    expect($walkIn->doctor_id)->toBe($doctor->id)
        ->and($walkIn->start_time->format('H:i'))->toBe('08:30')
        ->and($walkIn->end_time->format('H:i'))->toBe('09:00');

    $this->post(route('receptionist.walk-ins.store'), [...$registration, 'start_time' => '08:30'])
        ->assertSessionHasErrors('start_time');
    expect(Appointment::query()->where('type', 'walk_in')->where('doctor_id', $doctor->id)->count())->toBe(1);
});

test('receptionist can later assign a waiting walk-in without taking an online slot', function () {
    $this->travelTo('2026-09-18 08:15:00');
    $staff = receptionist();
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'availability' => [['day' => 'fri', 'start' => '08:00', 'end' => '10:00']],
    ]);
    $patient = User::factory()->create(['role' => 'patient']);
    $walkIn = Appointment::create([
        'user_id' => $patient->id, 'appointment_date' => today(),
        'type' => 'walk_in', 'status' => 'pending', 'arrived_at' => now(),
        'service_types' => ['PE'],
    ]);
    Appointment::create([
        'user_id' => User::factory()->create(['role' => 'patient'])->id,
        'doctor_id' => $doctor->id, 'appointment_date' => today(),
        'start_time' => '09:00', 'end_time' => '09:30',
        'type' => 'individual', 'status' => 'accepted', 'service_types' => ['PE'],
    ]);

    $this->actingAs($staff)->patch(route('receptionist.walk-ins.doctor', $walkIn), [
        'doctor_id' => $doctor->id, 'start_time' => '09:00',
    ])->assertSessionHasErrors('start_time');
    expect($walkIn->refresh()->doctor_id)->toBeNull();

    $this->actingAs($staff)->patch(route('receptionist.walk-ins.doctor', $walkIn), [
        'doctor_id' => $doctor->id, 'start_time' => '08:30',
    ])->assertRedirect();
    expect($walkIn->refresh()->doctor_id)->toBe($doctor->id)
        ->and($walkIn->start_time->format('H:i'))->toBe('08:30');

    $this->actingAs($staff)->patch(route('receptionist.walk-ins.doctor', $walkIn), [
        'doctor_id' => $doctor->id, 'start_time' => '09:30',
    ])->assertSessionHasErrors('doctor_id');
});

test('receptionist cannot register walk ins while the clinic is closed on weekends', function () {
    $this->travelTo('2026-09-19 09:00:00');
    $patient = User::factory()->create(['role' => 'patient']);

    $this->actingAs(receptionist())
        ->post(route('receptionist.walk-ins.store'), [
            'patient_type' => 'existing',
            'user_id' => $patient->id,
            'examination_purpose' => 'medical_clearance',
            'service_types' => ['X-Ray'],
        ])
        ->assertSessionHasErrors('appointment_date');

    $this->assertDatabaseMissing('appointments', [
        'user_id' => $patient->id,
        'type' => 'walk_in',
    ]);
});

test('receptionist can mark online patients arrived but cannot change walk in clinical status', function () {
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
        ->patch(route('receptionist.walk-ins.status', $online), ['status' => 'arrived'])
        ->assertRedirect();

    expect($online->refresh()->status)->toBe('arrived');

    $this->actingAs($staff)
        ->patch(route('receptionist.walk-ins.status', $walkIn), ['status' => 'arrived'])
        ->assertForbidden();

    expect($walkIn->refresh()->status)->toBe('pending');
});

test('bulk employees never appear in or mutate through the walk-in queue', function () {
    $staff = receptionist();
    $employee = User::factory()->create(['role' => 'patient']);
    $bulkEmployee = Appointment::create([
        'user_id' => $employee->id,
        'appointment_date' => today(),
        'type' => 'company_bulk',
        'status' => 'arrived',
        'attendance_status' => 'arrived',
        'service_types' => ['PE'],
    ]);

    $this->actingAs($staff)->get(route('receptionist.walk-ins.index'))
        ->assertInertia(fn (Assert $page) => $page->has('walkIns.data', 0));
    $this->actingAs($staff)->get(route('receptionist.queue.index'))
        ->assertInertia(fn (Assert $page) => $page->has('walkIns.data', 0));
    $this->actingAs($staff)
        ->patch(route('receptionist.walk-ins.status', $bulkEmployee), ['status' => 'cancelled'])
        ->assertForbidden();

    expect($bulkEmployee->fresh()->status)->toBe('arrived');
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
