<?php

use App\Models\Appointment;
use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    Carbon::setTestNow('2026-08-17 08:00:00');
    config(['medical.booking_security.booking_attempts_per_minute' => 100]);
});

afterEach(fn () => Carbon::setTestNow());

function bookingPatient(): User
{
    $patient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    $patient->patientProfile()->create(['birthdate' => '1995-05-10', 'sex' => 'male']);

    return $patient;
}

function bookingDoctor(): User
{
    return User::factory()->create([
        'role' => 'doctor',
        'is_active' => true,
        'availability' => [
            ['day' => 'tue', 'start' => '08:00', 'end' => '12:00'],
            ['day' => 'wed', 'start' => '08:00', 'end' => '12:00'],
            ['day' => 'thu', 'start' => '08:00', 'end' => '12:00'],
        ],
    ]);
}

function postIndividual($test, User $patient, User $doctor, string $date, string $time = '08:00')
{
    return $test->actingAs($patient)->post(route('appointments.store'), [
        'type' => 'individual',
        'doctor_id' => $doctor->id,
        'appointment_date' => $date,
        'start_time' => $time,
        'service_types' => ['CBC'],
    ]);
}

function existingIndividual(User $patient, string $date, string $status = 'pending'): Appointment
{
    return Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => $date,
        'start_time' => '10:00',
        'end_time' => '10:30',
        'type' => 'individual',
        'status' => $status,
        'service_types' => ['CBC'],
    ]);
}

test('patient can book first appointment and another date when only one is active', function () {
    $patient = bookingPatient();
    $doctor = bookingDoctor();

    postIndividual($this, $patient, $doctor, '2026-08-18')->assertSessionDoesntHaveErrors();
    postIndividual($this, $patient, $doctor, '2026-08-19')->assertSessionDoesntHaveErrors();

    expect(Appointment::where('user_id', $patient->id)->count())->toBe(2);
});

test('same date is blocked through the direct post endpoint and audited', function () {
    $patient = bookingPatient();
    $doctor = bookingDoctor();
    existingIndividual($patient, '2026-08-18', 'accepted');

    postIndividual($this, $patient, $doctor, '2026-08-18', '08:30')
        ->assertSessionHasErrors(['appointment_date' => 'You already have an appointment scheduled for this date.']);

    expect(Appointment::where('user_id', $patient->id)->count())->toBe(1);
    $this->assertDatabaseHas('security_audits', [
        'target_user_id' => $patient->id,
        'action' => 'same_date_booking_blocked',
        'status' => 'blocked',
    ]);
});

test('patient cannot exceed two active future appointments', function () {
    $patient = bookingPatient();
    $doctor = bookingDoctor();
    existingIndividual($patient, '2026-08-18', 'pending');
    existingIndividual($patient, '2026-08-19', 'accepted');

    postIndividual($this, $patient, $doctor, '2026-08-20')
        ->assertSessionHasErrors('appointment_limit');

    expect(Appointment::where('user_id', $patient->id)->count())->toBe(2);
    $this->assertDatabaseHas('security_audits', ['action' => 'future_limit_reached', 'status' => 'blocked']);
});

test('cancelled and completed appointments do not count toward the future limit', function (string $status) {
    $patient = bookingPatient();
    $doctor = bookingDoctor();
    existingIndividual($patient, '2026-08-18', $status);
    existingIndividual($patient, '2026-08-19', 'accepted');

    postIndividual($this, $patient, $doctor, '2026-08-20')->assertSessionDoesntHaveErrors();
    expect(Appointment::where('user_id', $patient->id)->count())->toBe(3);
})->with(['cancelled', 'completed']);

test('repeated submissions create only one appointment', function () {
    $patient = bookingPatient();
    $doctor = bookingDoctor();

    postIndividual($this, $patient, $doctor, '2026-08-18')->assertSessionDoesntHaveErrors();
    postIndividual($this, $patient, $doctor, '2026-08-18')->assertSessionHasErrors('appointment_date');

    expect(Appointment::where('user_id', $patient->id)->count())->toBe(1);
});

test('unverified patient cannot directly post a booking', function () {
    $patient = User::factory()->unverified()->create(['role' => 'patient']);
    $doctor = bookingDoctor();

    postIndividual($this, $patient, $doctor, '2026-08-18')
        ->assertRedirect(route('verification.notice'));
    expect(Appointment::count())->toBe(0);
});

test('five blocked attempts create one review alert rather than banning the patient', function () {
    $patient = bookingPatient();
    $doctor = bookingDoctor();
    existingIndividual($patient, '2026-08-18', 'accepted');

    foreach (range(1, 5) as $_) {
        postIndividual($this, $patient, $doctor, '2026-08-18')->assertSessionHasErrors('appointment_date');
    }

    expect(SecurityAudit::where('action', 'rapid_booking_attempts')->count())->toBe(1)
        ->and($patient->refresh()->is_active)->toBeTrue();
});
