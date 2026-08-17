<?php

use App\Models\Appointment;
use App\Models\SecurityAudit;
use App\Models\User;
use App\Notifications\AppointmentConfirmed;
use App\Notifications\AppointmentRejected;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Carbon::setTestNow('2026-08-17 08:00:00');
    Notification::fake();
});

afterEach(fn () => Carbon::setTestNow());

function approvalUser(string $role): User
{
    $user = User::factory()->create(['role' => $role, 'is_active' => true]);
    if ($role === 'patient') {
        $user->patientProfile()->create(['birthdate' => '1993-04-12', 'sex' => 'female']);
    }

    return $user;
}

function approvalDoctor(): User
{
    return User::factory()->create([
        'role' => 'doctor',
        'is_active' => true,
        'availability' => [['day' => 'tue', 'start' => '08:00', 'end' => '12:00']],
    ]);
}

function pendingRequest(User $patient, User $doctor, array $extra = []): Appointment
{
    return Appointment::create(array_merge([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => '2026-08-18',
        'start_time' => '09:00',
        'end_time' => '09:30',
        'type' => 'individual',
        'status' => 'pending',
        'service_types' => ['CBC'],
    ], $extra));
}

test('admin confirms a pending individual request and the action is audited', function () {
    $admin = approvalUser('admin');
    $patient = approvalUser('patient');
    $appointment = pendingRequest($patient, approvalDoctor());

    $this->actingAs($admin)->patch(route('admin.appointments.approve', $appointment))->assertSessionHasNoErrors();

    expect($appointment->refresh()->status)->toBe('accepted')
        ->and($appointment->processed_by)->toBe($admin->id)
        ->and($appointment->processed_at)->not->toBeNull();
    $this->assertDatabaseHas('security_audits', ['action' => 'appointment_accepted', 'actor_id' => $admin->id]);
    Notification::assertSentTo($patient, AppointmentConfirmed::class);
});

test('admin rejection requires a reason, releases the request, and notifies the patient', function () {
    $admin = approvalUser('admin');
    $patient = approvalUser('patient');
    $appointment = pendingRequest($patient, approvalDoctor());

    $this->actingAs($admin)->patch(route('admin.appointments.reject', $appointment), [])->assertSessionHasErrors('reason');
    $this->patch(route('admin.appointments.reject', $appointment), ['reason' => 'doctor_unavailable'])->assertSessionHasNoErrors();

    expect($appointment->refresh()->status)->toBe('rejected')
        ->and($appointment->rejection_reason)->toBe('doctor_unavailable');
    $this->assertDatabaseHas('security_audits', ['action' => 'appointment_rejected', 'actor_id' => $admin->id]);
    Notification::assertSentTo($patient, AppointmentRejected::class);
});

test('non admins cannot approve or reject requests', function (string $role) {
    $actor = approvalUser($role);
    $appointment = pendingRequest(approvalUser('patient'), approvalDoctor());

    $this->actingAs($actor)->patch(route('admin.appointments.approve', $appointment))->assertForbidden();
    $this->patch(route('admin.appointments.reject', $appointment), ['reason' => 'other', 'details' => 'No capacity'])->assertForbidden();
})->with(['patient', 'doctor']);

test('a request cannot be processed twice', function () {
    $admin = approvalUser('admin');
    $appointment = pendingRequest(approvalUser('patient'), approvalDoctor());

    $this->actingAs($admin)->patch(route('admin.appointments.approve', $appointment));
    $this->patch(route('admin.appointments.reject', $appointment), ['reason' => 'other', 'details' => 'Changed'])->assertSessionHasErrors('appointment');

    expect($appointment->refresh()->status)->toBe('accepted');
});

test('rejecting a request releases its slot for another patient', function () {
    $admin = approvalUser('admin');
    $doctor = approvalDoctor();
    $first = pendingRequest(approvalUser('patient'), $doctor);
    $secondPatient = approvalUser('patient');

    $this->actingAs($admin)->patch(route('admin.appointments.reject', $first), ['reason' => 'schedule_adjustment']);
    $this->actingAs($secondPatient)->post(route('appointments.store'), [
        'type' => 'individual',
        'doctor_id' => $doctor->id,
        'appointment_date' => '2026-08-18',
        'start_time' => '09:00',
        'service_types' => ['CBC'],
    ])->assertSessionHasNoErrors();

    $this->assertDatabaseHas('appointments', [
        'user_id' => $secondPatient->id,
        'doctor_id' => $doctor->id,
        'status' => 'pending',
        'start_time' => '09:00',
    ]);
});

test('an appointment in the past cannot be confirmed', function () {
    $admin = approvalUser('admin');
    $doctor = approvalDoctor();
    $doctor->update(['availability' => [['day' => 'sun', 'start' => '07:00', 'end' => '12:00']]]);
    $appointment = pendingRequest(approvalUser('patient'), $doctor, ['appointment_date' => '2026-08-16']);

    $this->actingAs($admin)->patch(route('admin.appointments.approve', $appointment))->assertSessionHasErrors('appointment');
    expect($appointment->refresh()->status)->toBe('pending');
});
