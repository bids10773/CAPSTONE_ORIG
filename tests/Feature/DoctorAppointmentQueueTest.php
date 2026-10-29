<?php

use App\Models\Appointment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function doctorQueueAppointment(User $patient, User $doctor, array $overrides = []): Appointment
{
    return Appointment::create(array_merge([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['PE'],
    ], $overrides));
}

test('doctor queue shows assigned appointments from today onward and marks their editability', function () {
    $doctor = User::factory()->licensed()->create(['role' => 'doctor']);
    $otherDoctor = User::factory()->licensed()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);

    $today = doctorQueueAppointment($patient, $doctor);
    $upcoming = doctorQueueAppointment($patient, $doctor, ['appointment_date' => today()->addDay()]);
    doctorQueueAppointment($patient, $doctor, ['appointment_date' => today()->subDay()]);
    doctorQueueAppointment($patient, $otherDoctor);

    $this->actingAs($doctor)
        ->get(route('doctor.appointments'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('doctor/appointments/index')
            ->has('appointments.data', 2)
            ->where('appointments.data.0.id', $today->id)
            ->where('appointments.data.0.is_scheduled_today', true)
            ->where('appointments.data.1.id', $upcoming->id)
            ->where('appointments.data.1.is_scheduled_today', false));
});

test('doctor can start a physical examination only after check-in on its scheduled date', function () {
    $doctor = User::factory()->licensed()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $acceptedToday = doctorQueueAppointment($patient, $doctor);
    $arrivedToday = doctorQueueAppointment($patient, $doctor, [
        'status' => 'arrived',
        'arrived_at' => now(),
        'start_time' => now()->addHours(2)->format('H:i'),
    ]);
    $upcoming = doctorQueueAppointment($patient, $doctor, ['appointment_date' => today()->addDay()]);

    expect($doctor->can('updatePhysicalExam', $acceptedToday))->toBeFalse()
        ->and($doctor->can('updatePhysicalExam', $arrivedToday))->toBeTrue()
        ->and($doctor->can('updatePhysicalExam', $upcoming))->toBeFalse();

    $this->actingAs($doctor)
        ->get(route('doctor.physical-exams.create', $acceptedToday))
        ->assertForbidden();

    $this->actingAs($doctor)
        ->get(route('doctor.appointments.show', $upcoming))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('appointments/show')
            ->where('appointment.id', $upcoming->id));

    $this->actingAs($doctor)
        ->get(route('doctor.physical-exams.create', $upcoming))
        ->assertForbidden();
});

test('doctor queue exposes physical exam actions only when the doctor is authorized', function () {
    $doctor = User::factory()->licensed()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $cbc = doctorQueueAppointment($patient, $doctor, [
        'status' => 'arrived', 'arrived_at' => now(), 'service_types' => ['CBC'],
        'start_time' => '09:00',
    ]);
    $physical = doctorQueueAppointment($patient, $doctor, [
        'status' => 'arrived', 'arrived_at' => now(), 'start_time' => '10:00',
    ]);
    doctorQueueAppointment($patient, $doctor, ['start_time' => '11:00']);
    doctorQueueAppointment($patient, $doctor, [
        'appointment_date' => today()->addDay(), 'start_time' => '09:00',
    ]);

    $this->actingAs($doctor)->get(route('doctor.appointments'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.data.0.id', $cbc->id)
            ->where('appointments.data.0.can_start_physical_exam', true)
            ->where('appointments.data.1.id', $physical->id)
            ->where('appointments.data.1.can_start_physical_exam', true)
            ->where('appointments.data.2.can_start_physical_exam', false)
            ->where('appointments.data.3.can_start_physical_exam', false));

    $this->get(route('doctor.physical-exams.create', $cbc))->assertOk();
    $this->get(route('doctor.physical-exams.create', $physical))->assertOk();
});
