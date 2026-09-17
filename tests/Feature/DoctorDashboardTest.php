<?php

use App\Models\Appointment;
use App\Models\PatientProfile;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('doctor dashboard exposes appointment details for the upcoming appointment preview', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create([
        'role' => 'patient',
        'first_name' => 'Randolf',
        'last_name' => 'Arellano',
        'contact' => '09171234567',
    ]);

    PatientProfile::create([
        'user_id' => $patient->id,
        'birthdate' => '1995-04-12',
        'sex' => 'Male',
        'civil_status' => 'Single',
        'address' => 'Manila',
    ]);

    Appointment::create([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today()->addDay(),
        'start_time' => '08:00',
        'end_time' => '08:30',
        'type' => 'individual',
        'status' => 'accepted',
        'examination_purpose' => 'pre_employment',
        'service_types' => ['PE', 'CBC'],
    ]);

    $this->actingAs($doctor)
        ->get(route('doctor.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('doctor/dashboard')
            ->has('upcomingAppointments', 1)
            ->where('upcomingAppointments.0.examination_purpose', 'pre_employment')
            ->where('upcomingAppointments.0.service_types', ['PE', 'CBC'])
            ->where('upcomingAppointments.0.user.contact', '09171234567')
            ->where('upcomingAppointments.0.user.patient_profile.birthdate', '1995-04-12T00:00:00.000000Z')
            ->where('upcomingAppointments.0.user.patient_profile.sex', 'Male')
            ->where('upcomingAppointments.0.user.patient_profile.civil_status', 'Single'));
});

test('patients awaiting examination count matches todays actionable doctor queue', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);

    foreach ([today()->subDay(), today()->addDay()] as $date) {
        Appointment::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $date,
            'start_time' => '08:00',
            'end_time' => '08:30',
            'type' => 'individual',
            'status' => 'accepted',
            'service_types' => ['PE'],
        ]);
    }

    Appointment::create([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
        'start_time' => '09:00',
        'end_time' => '09:30',
        'type' => 'individual',
        'status' => 'arrived',
        'service_types' => ['PE'],
    ]);

    $this->actingAs($doctor)
        ->get(route('doctor.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('doctor/dashboard')
            ->where('pendingCount', 1));
});
