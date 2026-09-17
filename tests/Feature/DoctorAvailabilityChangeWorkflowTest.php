<?php

use App\Models\Appointment;
use App\Models\DoctorAvailabilityChangeRequest;
use App\Models\User;
use App\Notifications\DoctorAvailabilityChangeRequested;
use App\Notifications\DoctorScheduleChanged;
use App\Notifications\DoctorScheduleChangePending;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->travelTo('2026-09-14 07:00:00');
    Notification::fake();
});

function availabilityWorkflowUser(string $role, array $attributes = []): User
{
    return User::factory()->create(array_merge([
        'role' => $role,
        'is_active' => true,
    ], $attributes));
}

function availabilityWorkflowAppointment(User $patient, User $doctor, string $time, array $attributes = []): Appointment
{
    $start = \Illuminate\Support\Carbon::parse($time);

    return Appointment::create(array_merge([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
        'start_time' => $start->format('H:i'),
        'end_time' => $start->copy()->addMinutes(30)->format('H:i'),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['PE'],
    ], $attributes));
}

test('doctor submission remains pending and warns only patients affected by the requested availability', function () {
    $admin = availabilityWorkflowUser('admin');
    $receptionist = availabilityWorkflowUser('receptionist');
    $doctor = availabilityWorkflowUser('doctor', [
        'availability' => [['day' => 'mon', 'start' => '08:00', 'end' => '17:00']],
    ]);
    $affectedPatientA = availabilityWorkflowUser('patient');
    $affectedPatientB = availabilityWorkflowUser('patient');
    $unaffectedPatient = availabilityWorkflowUser('patient');
    $affectedA = availabilityWorkflowAppointment($affectedPatientA, $doctor, '08:00');
    $affectedB = availabilityWorkflowAppointment($affectedPatientB, $doctor, '08:30');
    $unaffected = availabilityWorkflowAppointment($unaffectedPatient, $doctor, '14:00');

    $this->actingAs($doctor)->patch(route('doctor.doctor-availability.update'), [
        'availability' => [['day' => 'mon', 'start' => '13:00', 'end' => '17:00']],
        'action' => 'save',
    ])->assertSessionHasNoErrors();

    $request = DoctorAvailabilityChangeRequest::query()->sole();
    expect($request->status)->toBe('pending')
        ->and($doctor->fresh()->availability)->toBe([['day' => 'mon', 'start' => '08:00', 'end' => '17:00']])
        ->and($affectedA->fresh()->start_time->format('H:i'))->toBe('08:00')
        ->and($affectedB->fresh()->start_time->format('H:i'))->toBe('08:30')
        ->and($unaffected->fresh()->start_time->format('H:i'))->toBe('14:00')
        ->and($affectedA->fresh()->status)->toBe('accepted');

    Notification::assertSentTo($admin, DoctorAvailabilityChangeRequested::class);
    Notification::assertSentTo($affectedPatientA, DoctorScheduleChangePending::class);
    Notification::assertSentTo($affectedPatientB, DoctorScheduleChangePending::class);
    Notification::assertNotSentTo($unaffectedPatient, DoctorScheduleChangePending::class);
    Notification::assertNotSentTo($receptionist, DoctorScheduleChanged::class);

    $this->actingAs($unaffectedPatient)->getJson(route('api.doctor.availability', [
        'doctorId' => $doctor->id,
        'date' => today()->toDateString(),
    ]))->assertOk()->assertJsonPath('slots.mon.0.start', '08:00');
});

test('admin can review current and requested availability with only affected appointments', function () {
    $admin = availabilityWorkflowUser('admin');
    $doctor = availabilityWorkflowUser('doctor', [
        'availability' => [['day' => 'mon', 'start' => '08:00', 'end' => '17:00']],
    ]);
    $affectedPatient = availabilityWorkflowUser('patient');
    $unaffectedPatient = availabilityWorkflowUser('patient');
    $affected = availabilityWorkflowAppointment($affectedPatient, $doctor, '08:00');
    availabilityWorkflowAppointment($unaffectedPatient, $doctor, '14:00');
    $changeRequest = DoctorAvailabilityChangeRequest::create([
        'doctor_id' => $doctor->id,
        'current_availability' => $doctor->availability,
        'requested_availability' => [['day' => 'mon', 'start' => '13:00', 'end' => '17:00']],
        'status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.doctor-availability.index', [
            'doctor_id' => $doctor->id,
            'request_id' => $changeRequest->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/doctor-availability/index')
            ->where('selectedRequest.id', $changeRequest->id)
            ->where('selectedRequest.current_availability.0.start', '08:00')
            ->where('selectedRequest.requested_availability.0.start', '13:00')
            ->has('selectedRequest.affected_appointments', 1)
            ->where('selectedRequest.affected_appointments.0.id', $affected->id));
});

test('admin acceptance atomically applies availability and moves only affected appointments into valid unique slots', function () {
    $admin = availabilityWorkflowUser('admin');
    $receptionist = availabilityWorkflowUser('receptionist');
    $doctor = availabilityWorkflowUser('doctor', [
        'availability' => [['day' => 'mon', 'start' => '08:00', 'end' => '17:00']],
    ]);
    $affectedA = availabilityWorkflowAppointment(availabilityWorkflowUser('patient'), $doctor, '08:00');
    $affectedB = availabilityWorkflowAppointment(availabilityWorkflowUser('patient'), $doctor, '08:30');
    $unaffected = availabilityWorkflowAppointment(availabilityWorkflowUser('patient'), $doctor, '14:00');
    $changeRequest = DoctorAvailabilityChangeRequest::create([
        'doctor_id' => $doctor->id,
        'current_availability' => $doctor->availability,
        'requested_availability' => [['day' => 'mon', 'start' => '13:00', 'end' => '17:00']],
        'status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.doctor-availability-requests.approve', $changeRequest))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($doctor->fresh()->availability)->toBe([['day' => 'mon', 'start' => '13:00', 'end' => '17:00']])
        ->and($changeRequest->fresh()->status)->toBe('accepted')
        ->and($changeRequest->fresh()->reviewed_by)->toBe($admin->id)
        ->and($affectedA->fresh()->start_time->format('H:i'))->toBe('13:00')
        ->and($affectedB->fresh()->start_time->format('H:i'))->toBe('13:30')
        ->and($unaffected->fresh()->start_time->format('H:i'))->toBe('14:00')
        ->and($affectedA->fresh()->status)->toBe('accepted')
        ->and($affectedB->fresh()->status)->toBe('accepted')
        ->and($unaffected->fresh()->status)->toBe('accepted');

    expect($affectedA->fresh()->end_time->format('H:i'))->toBe('13:30')
        ->and($affectedB->fresh()->end_time->format('H:i'))->toBe('14:00');
    Notification::assertSentTo($receptionist, DoctorScheduleChanged::class);
});

test('admin rejection preserves the active availability and every appointment', function () {
    $admin = availabilityWorkflowUser('admin');
    $doctor = availabilityWorkflowUser('doctor', [
        'availability' => [['day' => 'mon', 'start' => '08:00', 'end' => '17:00']],
    ]);
    $appointment = availabilityWorkflowAppointment(availabilityWorkflowUser('patient'), $doctor, '08:00');
    $changeRequest = DoctorAvailabilityChangeRequest::create([
        'doctor_id' => $doctor->id,
        'current_availability' => $doctor->availability,
        'requested_availability' => [['day' => 'mon', 'start' => '13:00', 'end' => '17:00']],
        'status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.doctor-availability-requests.reject', $changeRequest))
        ->assertSessionHasNoErrors();

    expect($changeRequest->fresh()->status)->toBe('rejected')
        ->and($doctor->fresh()->availability)->toBe([['day' => 'mon', 'start' => '08:00', 'end' => '17:00']])
        ->and($appointment->fresh()->start_time->format('H:i'))->toBe('08:00')
        ->and($appointment->fresh()->status)->toBe('accepted');
});

test('approval rolls back when an affected appointment has no valid replacement slot', function () {
    $admin = availabilityWorkflowUser('admin');
    $receptionist = availabilityWorkflowUser('receptionist');
    $doctor = availabilityWorkflowUser('doctor', [
        'availability' => [['day' => 'mon', 'start' => '08:00', 'end' => '17:00']],
    ]);
    $appointment = availabilityWorkflowAppointment(availabilityWorkflowUser('patient'), $doctor, '08:00');
    $changeRequest = DoctorAvailabilityChangeRequest::create([
        'doctor_id' => $doctor->id,
        'current_availability' => $doctor->availability,
        'requested_availability' => [],
        'status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.doctor-availability-requests.approve', $changeRequest))
        ->assertSessionHasErrors('request');

    expect($changeRequest->fresh()->status)->toBe('pending')
        ->and($doctor->fresh()->availability)->toBe([['day' => 'mon', 'start' => '08:00', 'end' => '17:00']])
        ->and($appointment->fresh()->start_time->format('H:i'))->toBe('08:00')
        ->and($appointment->fresh()->status)->toBe('accepted');
    Notification::assertNotSentTo($receptionist, DoctorScheduleChanged::class);
});

test('non admins cannot approve or reject availability requests and doctors cannot submit for another doctor', function () {
    $doctor = availabilityWorkflowUser('doctor', [
        'availability' => [['day' => 'mon', 'start' => '08:00', 'end' => '17:00']],
    ]);
    $otherDoctor = availabilityWorkflowUser('doctor', [
        'availability' => [['day' => 'tue', 'start' => '08:00', 'end' => '17:00']],
    ]);
    $patient = availabilityWorkflowUser('patient');
    $changeRequest = DoctorAvailabilityChangeRequest::create([
        'doctor_id' => $otherDoctor->id,
        'current_availability' => $otherDoctor->availability,
        'requested_availability' => [],
        'status' => 'pending',
    ]);

    $this->actingAs($patient)
        ->patch(route('admin.doctor-availability-requests.approve', $changeRequest))
        ->assertForbidden();
    $this->actingAs($doctor)
        ->patch(route('admin.doctor-availability-requests.reject', $changeRequest))
        ->assertForbidden();

    $this->patch(route('doctor.doctor-availability.update'), [
        'doctor_id' => $otherDoctor->id,
        'availability' => [['day' => 'mon', 'start' => '09:00', 'end' => '17:00']],
    ])->assertSessionHasNoErrors();

    $doctorRequest = DoctorAvailabilityChangeRequest::query()
        ->where('doctor_id', $doctor->id)
        ->sole();
    expect($doctorRequest->requested_availability)->toBe([['day' => 'mon', 'start' => '09:00', 'end' => '17:00']])
        ->and($otherDoctor->fresh()->availability)->toBe([['day' => 'tue', 'start' => '08:00', 'end' => '17:00']]);
});

test('doctor and admin cannot add weekend availability', function () {
    $admin = availabilityWorkflowUser('admin');
    $doctor = availabilityWorkflowUser('doctor');
    $weekend = [['day' => 'sat', 'start' => '08:00', 'end' => '17:00']];

    $this->actingAs($doctor)
        ->patch(route('doctor.doctor-availability.update'), ['availability' => $weekend])
        ->assertSessionHasErrors('availability.0.day');

    $this->actingAs($admin)
        ->patch(route('admin.doctor-availability.update'), [
            'doctor_id' => $doctor->id,
            'availability' => $weekend,
        ])
        ->assertSessionHasErrors('availability.0.day');
});
