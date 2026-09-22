<?php

use App\Models\Appointment;
use App\Models\User;

test('regular appointment results and evaluation require the assigned doctor', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $otherDoctor = User::factory()->create(['role' => 'doctor']);
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
