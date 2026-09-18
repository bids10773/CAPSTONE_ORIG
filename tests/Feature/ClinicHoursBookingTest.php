<?php

use App\Models\Appointment;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

afterEach(fn () => Carbon::setTestNow());

test('welcome page shows the configured clinic hours', function () {
    Carbon::setTestNow(Carbon::parse('2026-09-18 17:10:00', 'Asia/Manila'));

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->component('welcome')
        ->where('clinicHours.timezone', 'Asia/Manila')
        ->where('clinicHours.opensAt', '08:00')
        ->where('clinicHours.closesAt', '17:00')
        ->etc());
});

test('clinic hours are shared with every Inertia page', function () {
    Carbon::setTestNow(Carbon::parse('2026-09-18 17:10:00', 'Asia/Manila'));

    $this->get('/login')->assertInertia(fn (Assert $page) => $page
        ->component('auth/login')
        ->where('clinicHours.timezone', 'Asia/Manila')
        ->where('clinicHours.closesAt', '17:00')
        ->etc());
});

test('closed day cannot be booked after clinic hours and the next working day can', function () {
    Carbon::setTestNow(Carbon::parse('2026-09-18 17:10:00', 'Asia/Manila'));
    $patient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    $patient->patientProfile()->create(['birthdate' => '1995-05-10', 'sex' => 'male']);
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'is_active' => true,
        'availability' => [
            ['day' => 'fri', 'start' => '08:00', 'end' => '17:00'],
            ['day' => 'mon', 'start' => '08:00', 'end' => '17:00'],
        ],
    ]);

    $payload = [
        'type' => 'individual',
        'doctor_id' => $doctor->id,
        'start_time' => '09:00',
        'service_types' => ['CBC'],
    ];

    $this->actingAs($patient)->post(route('appointments.store'), [
        ...$payload,
        'appointment_date' => '2026-09-18',
    ])->assertSessionHasErrors('appointment_date');

    $this->getJson('/api/doctors')->assertJsonPath('0.date_slot_counts.2026-09-18', 0);

    $this->post(route('appointments.store'), [
        ...$payload,
        'appointment_date' => '2026-09-21',
    ])->assertSessionHasNoErrors();

    expect(Appointment::query()->where('user_id', $patient->id)->count())->toBe(1);
});
