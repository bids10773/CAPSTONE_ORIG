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
    $doctor = User::factory()->create(['role' => 'doctor']);
    $otherDoctor = User::factory()->create(['role' => 'doctor']);
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

test('doctor cannot edit a physical examination before its scheduled date', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $today = doctorQueueAppointment($patient, $doctor);
    $upcoming = doctorQueueAppointment($patient, $doctor, ['appointment_date' => today()->addDay()]);

    expect($doctor->can('updatePhysicalExam', $today))->toBeTrue()
        ->and($doctor->can('updatePhysicalExam', $upcoming))->toBeFalse();

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
