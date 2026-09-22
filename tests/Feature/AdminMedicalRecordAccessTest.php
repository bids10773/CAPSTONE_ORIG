<?php

use App\Models\Appointment;
use App\Models\User;

test('admin can search and view patient records but cannot change clinical records', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create([
        'role' => 'patient',
        'first_name' => 'RecordSearch',
        'last_name' => 'Patient',
    ]);
    $patient->patientProfile()->create([
        'birthdate' => today()->subYears(30),
        'sex' => 'Male',
    ]);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['PE', 'CBC', 'X-Ray'],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.patients.index', ['search' => 'RecordSearch']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/patients/index')
            ->has('patients.data', 1)
            ->where('patients.data.0.id', $patient->id));

    $this->get(route('admin.appointments.show', $appointment))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('appointments/show')
            ->where('appointmentsIndexUrl', '/admin/appointments')
            ->where('appointment.user.patient_profile.sex', 'Male')
            ->where('appointment.user.patient_profile.age', 30));

    expect($admin->can('viewClinicalForms', $appointment))->toBeTrue()
        ->and($admin->cannot('updatePhysicalExam', $appointment))->toBeTrue()
        ->and($admin->cannot('updateLaboratory', $appointment))->toBeTrue()
        ->and($admin->cannot('updateXray', $appointment))->toBeTrue()
        ->and($admin->cannot('finalizeMedicalEvaluation', $appointment))->toBeTrue()
        ->and($admin->cannot('verifyDiagnosticResults', $appointment))->toBeTrue()
        ->and($admin->cannot('releaseMedicalReport', $appointment))->toBeTrue();

    $this->post(route('admin.physical-exams.update', $appointment))->assertForbidden();
    $this->post(route('admin.lab-results.update', $appointment))->assertForbidden();
    $this->post(route('admin.xrays.update', $appointment))->assertForbidden();
    $this->post(route('admin.medical-reports.release', $appointment))->assertForbidden();
});

test('medical record returns doctors to the doctor appointment list', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['PE'],
    ]);

    $this->actingAs($doctor)
        ->get(route('doctor.appointments.show', $appointment))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('appointments/show')
            ->where('appointmentsIndexUrl', '/doctor/appointments'));
});

test('admin can inspect available clinical files before an appointment is completed while the patient cannot', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'for_diagnostics',
        'service_types' => ['CBC', 'X-Ray'],
    ]);
    $appointment->labResult()->create([
        'cbc_results' => ['hemoglobin' => '14.2'],
        'encoded_by' => User::factory()->create(['role' => 'medtech'])->id,
        'status' => 'finalized',
        'is_completed' => true,
    ]);
    $appointment->xrayReport()->create([
        'radiologist_id' => User::factory()->create(['role' => 'radtech'])->id,
        'findings' => 'Clear lung fields',
        'impression' => 'Normal chest X-ray',
        'status' => 'completed',
        'is_completed' => true,
        'verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.appointments.show', $appointment))
        ->assertOk();
    $this->get(route('clinical-forms.laboratory.section.pdf', [$appointment, 'cbc']))
        ->assertOk()->assertHeader('content-type', 'application/pdf');
    $this->get(route('clinical-forms.xray.pdf', $appointment))
        ->assertOk()->assertHeader('content-type', 'application/pdf');

    $this->actingAs($patient)
        ->get(route('clinical-forms.laboratory.section.pdf', [$appointment, 'cbc']))
        ->assertForbidden();
    $this->get(route('clinical-forms.xray.pdf', $appointment))
        ->assertForbidden();
});
