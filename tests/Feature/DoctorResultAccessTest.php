<?php

use App\Models\Appointment;
use App\Models\User;

test('doctor record view includes intake measurements without exposing them in the patient payload', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->licensed()->create(['role' => 'doctor']);
    $appointment = Appointment::create([
        'user_id' => $patient->id, 'doctor_id' => $doctor->id,
        'appointment_date' => today(), 'type' => 'individual', 'status' => 'arrived',
        'arrived_at' => now(), 'service_types' => ['CBC'],
    ]);
    $appointment->vitalSigns()->create([
        'patient_id' => $patient->id,
        'submission_key' => (string) \Illuminate\Support\Str::uuid(),
        'measured_at' => now(), 'heart_rate' => 72, 'bmi' => 22.5,
        'visual_acuity' => '20/20 OU', 'hearing' => 'Normal bilateral',
    ]);

    $this->actingAs($doctor)->get(route('doctor.appointments.show', $appointment))
        ->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
        ->where('appointment.latest_vital_sign.heart_rate', 72)
        ->where('appointment.latest_vital_sign.visual_acuity', '20/20 OU'));

    $this->actingAs($patient)->get(route('appointments.show', $appointment))
        ->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
        ->missing('appointment.latest_vital_sign')
        ->where('appointment.medical_history', null));
});

test('regular appointment results and evaluation require the assigned doctor', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->licensed()->create(['role' => 'doctor']);
    $otherDoctor = User::factory()->licensed()->create(['role' => 'doctor']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'arrived',
        'service_types' => ['PE', 'CBC'],
    ]);

    foreach ([$doctor, $otherDoctor] as $viewer) {
        expect($viewer->cannot('viewClinicalForms', $appointment))->toBeTrue()
            ->and($viewer->cannot('finalizeMedicalEvaluation', $appointment))->toBeTrue()
            ->and($viewer->cannot('verifyDiagnosticResults', $appointment))->toBeTrue()
            ->and($viewer->cannot('updatePhysicalExam', $appointment))->toBeTrue();

        $this->actingAs($viewer)
            ->get(route('clinical-forms.laboratory.pdf', $appointment))
            ->assertForbidden();
        $this->get(route('doctor.final-evaluation', $appointment))->assertForbidden();
        $this->post(route('doctor.final-evaluation.store', $appointment))->assertForbidden();
    }

    $appointment->update(['doctor_id' => $doctor->id]);

    expect($doctor->can('viewClinicalForms', $appointment))->toBeTrue()
        ->and($doctor->can('finalizeMedicalEvaluation', $appointment))->toBeTrue()
        ->and($doctor->can('verifyDiagnosticResults', $appointment))->toBeTrue()
        ->and($doctor->can('updatePhysicalExam', $appointment))->toBeTrue()
        ->and($otherDoctor->cannot('viewClinicalForms', $appointment))->toBeTrue()
        ->and($otherDoctor->cannot('finalizeMedicalEvaluation', $appointment))->toBeTrue();

    $this->actingAs($otherDoctor)
        ->get(route('clinical-forms.laboratory.pdf', $appointment))
        ->assertForbidden();
    $this->get(route('doctor.final-evaluation', $appointment))->assertForbidden();
    $this->post(route('doctor.final-evaluation.store', $appointment))->assertForbidden();

    $this->actingAs($doctor)
        ->get(route('doctor.final-evaluation', $appointment))
        ->assertOk();
});
