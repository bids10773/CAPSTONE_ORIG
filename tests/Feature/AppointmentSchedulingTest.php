<?php

use App\Models\Appointment;
use App\Models\User;
use App\Services\AppointmentSchedulingService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    Carbon::setTestNow('2026-08-07 09:00:00');
    Notification::fake();
});

afterEach(fn () => Carbon::setTestNow());

function scheduledPatient(array $attributes = []): Appointment
{
    $patient = User::factory()->create(['role' => 'patient']);

    return Appointment::create(array_merge([
        'user_id' => $patient->id,
        'appointment_date' => '2026-08-07',
        'start_time' => '09:00',
        'end_time' => '09:30',
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['CBC'],
    ], $attributes));
}

function waitingWalkIn(string $arrival, array $attributes = []): Appointment
{
    $patient = User::factory()->create(['role' => 'patient']);

    return Appointment::create(array_merge([
        'user_id' => $patient->id,
        'appointment_date' => '2026-08-07',
        'type' => 'walk_in',
        'status' => 'pending',
        'arrived_at' => $arrival,
        'service_types' => ['CBC'],
    ], $attributes));
}

test('online patient can check in before and exactly at the grace deadline', function (string $time) {
    $appointment = scheduledPatient();
    $staff = User::factory()->create(['role' => 'receptionist']);

    app(AppointmentSchedulingService::class)->checkIn($appointment, $staff, Carbon::parse($time));

    expect($appointment->refresh())
        ->status->toBe('arrived')
        ->checked_in_by->toBe($staff->id)
        ->auto_cancelled_at->toBeNull();
})->with(['2026-08-07 09:09:59', '2026-08-07 09:10:00']);

test('scheduler cancels only after grace and reassigns the slot to the earliest arrived walk in', function () {
    $later = waitingWalkIn('2026-08-07 08:50:00');
    $earlier = waitingWalkIn('2026-08-07 08:40:00');
    $online = scheduledPatient();
    $service = app(AppointmentSchedulingService::class);

    expect($service->expireLateAppointments(Carbon::parse('2026-08-07 09:10:00')))->toBe(0);
    expect($service->expireLateAppointments(Carbon::parse('2026-08-07 09:10:01')))->toBe(1);

    expect($online->refresh())
        ->status->toBe('cancelled')
        ->auto_cancelled_at->not->toBeNull()
        ->cancellation_reason->toContain('10-minute');
    expect($earlier->refresh())
        ->released_from_appointment_id->toBe($online->id)
        ->start_time->format('H:i')->toBe('09:00');
    expect($later->refresh()->released_from_appointment_id)->toBeNull();
});

test('scheduler automatically rejects an individual request after its pending time passes', function () {
    $pending = scheduledPatient(['status' => 'pending']);
    $service = app(AppointmentSchedulingService::class);

    expect($service->expireLateAppointments(Carbon::parse('2026-08-07 09:00:00')))->toBe(0)
        ->and($service->expireLateAppointments(Carbon::parse('2026-08-07 09:00:01')))->toBe(1)
        ->and($pending->refresh()->status)->toBe('rejected')
        ->and($pending->rejection_reason)->toBe('schedule_expired')
        ->and($pending->processed_at)->not->toBeNull();

    $this->assertDatabaseHas('security_audits', [
        'action' => 'appointment_auto_rejected',
        'target_user_id' => $pending->user_id,
    ]);
});

test('expiry is idempotent and does not duplicate a released slot assignment', function () {
    $walkIn = waitingWalkIn('2026-08-07 08:30:00');
    $online = scheduledPatient();
    $service = app(AppointmentSchedulingService::class);
    $late = Carbon::parse('2026-08-07 09:11:00');

    expect($service->expireLateAppointments($late))->toBe(1)
        ->and($service->expireLateAppointments($late))->toBe(0)
        ->and($walkIn->refresh()->released_from_appointment_id)->toBe($online->id);

    $this->assertDatabaseCount('appointments', 2);
});

test('late online arrival cannot displace the walk in assigned to the released slot', function () {
    $walkIn = waitingWalkIn('2026-08-07 08:30:00');
    $online = scheduledPatient();
    $staff = User::factory()->create(['role' => 'receptionist']);
    $service = app(AppointmentSchedulingService::class);
    $late = Carbon::parse('2026-08-07 09:11:00');

    $service->expireLateAppointments($late);

    expect(fn () => $service->checkIn($online, $staff, $late))
        ->toThrow(ValidationException::class);
    expect($walkIn->refresh()->released_from_appointment_id)->toBe($online->id)
        ->and($online->refresh()->status)->toBe('cancelled');
});

test('completed cancelled arrived and bulk appointments are not expired', function (array $attributes) {
    $appointment = scheduledPatient($attributes);

    expect(app(AppointmentSchedulingService::class)
        ->expireLateAppointments(Carbon::parse('2026-08-07 12:00:00')))->toBe(0)
        ->and($appointment->refresh()->auto_cancelled_at)->toBeNull();
})->with([
    [['status' => 'completed']],
    [['status' => 'cancelled']],
    [['status' => 'arrived', 'arrived_at' => '2026-08-07 09:05:00']],
    [['type' => 'company_bulk']],
]);

test('scheduler safely releases a late slot when no walk in is waiting', function () {
    $online = scheduledPatient();

    expect(app(AppointmentSchedulingService::class)
        ->expireLateAppointments(Carbon::parse('2026-08-07 09:11:00')))->toBe(1)
        ->and($online->refresh()->replacementWalkIn)->toBeNull();
});

test('patient sees only doctors with open slots after selecting a date', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $availableDoctor = User::factory()->create([
        'role' => 'doctor',
        'is_active' => true,
        'availability' => [['day' => 'sat', 'start' => '09:00', 'end' => '10:00']],
    ]);
    $fullDoctor = User::factory()->create([
        'role' => 'doctor',
        'is_active' => true,
        'availability' => [['day' => 'sat', 'start' => '09:00', 'end' => '10:00']],
    ]);

    scheduledPatient([
        'doctor_id' => $fullDoctor->id,
        'appointment_date' => '2026-08-08',
        'status' => 'pending',
    ]);
    scheduledPatient([
        'doctor_id' => $fullDoctor->id,
        'appointment_date' => '2026-08-08',
        'start_time' => '09:30',
        'end_time' => '10:00',
        'status' => 'accepted',
    ]);

    $this->actingAs($patient)
        ->getJson('/api/available-doctors?date=2026-08-08')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', $availableDoctor->id)
        ->assertJsonPath('0.free_slots', 2);
});

test('booked times are hidden while cancelled times remain available', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'is_active' => true,
        'availability' => [['day' => 'sat', 'start' => '09:00', 'end' => '10:00']],
    ]);

    scheduledPatient([
        'doctor_id' => $doctor->id,
        'appointment_date' => '2026-08-08',
        'status' => 'for_diagnostics',
    ]);
    scheduledPatient([
        'doctor_id' => $doctor->id,
        'appointment_date' => '2026-08-08',
        'start_time' => '09:30',
        'end_time' => '10:00',
        'status' => 'cancelled',
    ]);

    $this->actingAs($patient)
        ->getJson("/api/doctors/{$doctor->id}/availability?date=2026-08-08")
        ->assertOk()
        ->assertJsonPath('availableTimes', ['09:30']);
});
