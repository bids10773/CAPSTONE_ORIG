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

test('doctor queue only shows appointments assigned to the doctor for today', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $otherDoctor = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);

    $today = doctorQueueAppointment($patient, $doctor);
    doctorQueueAppointment($patient, $doctor, ['appointment_date' => today()->addDay()]);
    doctorQueueAppointment($patient, $otherDoctor);

    $this->actingAs($doctor)
        ->get(route('doctor.appointments'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('doctor/appointments/index')
            ->has('appointments.data', 1)
            ->where('appointments.data.0.id', $today->id));
});
