<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\PatientProfile;
use App\Models\User;

function clinicalAppointment(array $services = ['CBC']): Appointment
{
    $company = Company::create(['company_name' => 'LMIC Test Partner', 'status' => 'active']);
    $patient = User::factory()->create(['role' => 'patient', 'sex' => 'female']);
    PatientProfile::create([
        'user_id' => $patient->id, 'birthdate' => '1995-05-20', 'sex' => 'Female',
        'civil_status' => 'Single', 'employee_number' => 'EMP-1001',
    ]);

    return Appointment::create([
        'user_id' => $patient->id, 'company_id' => $company->id,
        'appointment_date' => now(), 'type' => 'company_referral',
        'status' => 'for_diagnostics', 'service_types' => $services,
    ]);
}

function cbcPayload(bool $finalize = true): array
{
    return ['finalize' => $finalize, 'remarks' => 'Specimen acceptable.', 'results' => ['cbc' => [
        'hemoglobin' => '14.2', 'hematocrit' => '0.42', 'rbc_count' => '4.8', 'wbc_count' => '7.1',
        'segmenters' => '0.60', 'lymphocytes' => '0.32', 'monocytes' => '0.04',
        'eosinophils' => '0.03', 'basophils' => '0.01', 'stab' => '0.02', 'meta' => '0.00',
        'differential_others' => 'None', 'platelet_count' => '250', 'verification_note' => 'Repeated and verified',
    ]]];
}

test('medtech saves structured laboratory results and finalization advances workflow', function () {
    $appointment = clinicalAppointment();
    $medtech = User::factory()->create(['role' => 'medtech']);

    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), cbcPayload())
        ->assertRedirect(route('medtech.appointments'))->assertSessionHas('success');

    $result = $appointment->labResult()->firstOrFail();
    expect($result->cbc_results['hemoglobin'])->toBe('14.2')
        ->and($result->isFinalized())->toBeTrue()
        ->and($appointment->fresh()->status)->toBe('for_final_evaluation');
    $this->assertDatabaseHas('clinical_form_audits', [
        'appointment_id' => $appointment->id, 'form_type' => 'laboratory', 'action' => 'created',
    ]);
});

test('requested xray controls the next workflow stage', function () {
    $appointment = clinicalAppointment(['CBC', 'X-Ray']);
    $medtech = User::factory()->create(['role' => 'medtech']);
    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), cbcPayload());
    expect($appointment->fresh()->status)->toBe('for_xray');
});

test('finalized laboratory reports cannot be overwritten by medical staff', function () {
    $appointment = clinicalAppointment();
    $medtech = User::factory()->create(['role' => 'medtech']);
    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), cbcPayload());

    $changed = cbcPayload(false);
    $changed['results']['cbc']['hemoglobin'] = '5.0';
    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), $changed)
        ->assertSessionHasErrors('form');
    expect($appointment->labResult->fresh()->cbc_results['hemoglobin'])->toBe('14.2');
});

test('patient can download completed laboratory PDF but receptionist cannot access clinical forms', function () {
    $appointment = clinicalAppointment();
    $medtech = User::factory()->create(['role' => 'medtech', 'license_no' => 'RMT-123']);
    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), cbcPayload());

    $this->actingAs($appointment->user)->get(route('clinical-forms.laboratory.pdf', $appointment))
        ->assertOk()->assertHeader('content-type', 'application/pdf');
    $this->actingAs($appointment->user)->get(route('clinical-forms.laboratory.section.pdf', [$appointment, 'cbc']))
        ->assertOk()->assertHeader('content-type', 'application/pdf');

    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $this->actingAs($receptionist)->get(route('clinical-forms.laboratory.pdf', $appointment))->assertForbidden();
});

test('patient cannot download a laboratory form that was not selected for the appointment', function () {
    $appointment = clinicalAppointment(['CBC']);
    $medtech = User::factory()->create(['role' => 'medtech']);
    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), cbcPayload());

    $this->actingAs($appointment->user)
        ->get(route('clinical-forms.laboratory.section.pdf', [$appointment, 'urinalysis']))
        ->assertNotFound();
});

test('patient can download every selected laboratory service form', function () {
    $sections = [
        'cbc' => ['CBC', 'cbc_results'],
        'urinalysis' => ['Urinalysis', 'urinalysis_results'],
        'fecalysis' => ['Fecalysis', 'fecalysis_results'],
        'drug_test' => ['Drug Test', 'drug_test_results'],
        'serology' => ['Hepatitis', 'serology_results'],
        'pregnancy' => ['Pregnancy Test', 'pregnancy_test'],
        'blood_chemistry' => ['Blood Chemistry', 'blood_chemistry_results'],
        'blood_type' => ['Blood Typing', 'blood_type'],
    ];
    $appointment = clinicalAppointment(array_column($sections, 0));
    $medtech = User::factory()->create(['role' => 'medtech']);
    $results = collect($sections)->mapWithKeys(
        fn (array $definition): array => [$definition[1] => ['result' => 'Normal']],
    )->all();
    $appointment->labResult()->create($results + [
        'encoded_by' => $medtech->id,
        'status' => 'finalized',
        'is_completed' => true,
    ]);

    foreach (array_keys($sections) as $section) {
        $this->actingAs($appointment->user)
            ->get(route('clinical-forms.laboratory.section.pdf', [$appointment, $section]))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }
});

test('unsupported appointments cannot submit fabricated laboratory sections', function () {
    $appointment = clinicalAppointment(['PE']);
    $medtech = User::factory()->create(['role' => 'medtech']);
    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), [
        'finalize' => true, 'results' => ['cbc' => cbcPayload()['results']['cbc']],
    ])->assertSessionHasErrors();
    $this->assertDatabaseMissing('lab_results', ['appointment_id' => $appointment->id]);
});

test('doctor records structured physical findings and final approval locks the encounter', function () {
    $appointment = clinicalAppointment(['PE']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $parts = ['head_scalp', 'eyes', 'ears', 'nose_sinuses', 'mouth_throat', 'neck_thyroid', 'chest_breast', 'lungs', 'heart', 'abdomen', 'back', 'anus', 'genitals', 'extremities', 'skin', 'dental'];
    $payload = [
        'height' => 170, 'weight' => 65, 'blood_pressure' => '120 / 80',
        'pulse_rate' => 72, 'temperature' => 36.7, 'remarks' => 'No acute distress.',
    ];
    foreach ($parts as $part) {
        $payload["{$part}_status"] = 'normal';
        $payload[$part] = null;
    }

    $this->actingAs($doctor)->post(route('doctor.physical-exams.store', $appointment), $payload)
        ->assertSessionHas('success');
    expect($appointment->fresh()->status)->toBe('for_final_evaluation')
        ->and($appointment->physicalExam->head_scalp)->toBeNull()
        ->and($appointment->physicalExam->blood_pressure)->toBe('120/80');

    $this->actingAs($doctor)->post(route('doctor.final-evaluation.store', $appointment), [
        'medical_class' => 'A', 'final_remarks' => 'Fit to work.',
    ])->assertSessionHas('success');
    expect($appointment->fresh()->status)->toBe('completed')
        ->and($appointment->physicalExam->fresh()->classification)->toBe('Class A')
        ->and($appointment->physicalExam->fresh()->finalized_at)->not->toBeNull();
});

test('radtech completion stores one xray report and advances to final evaluation', function () {
    $appointment = clinicalAppointment(['X-Ray']);
    $appointment->update(['status' => 'for_xray']);
    $radtech = User::factory()->create(['role' => 'radtech']);

    $this->actingAs($radtech)->post(route('radtech.xrays.store', $appointment), [
        'chest_status' => 'normal',
        'chest_findings' => 'Both lungs are clear. Heart is not enlarged.',
        'impression' => 'Essentially normal chest X-ray.',
    ])->assertSessionHas('success');

    expect($appointment->fresh()->status)->toBe('for_final_evaluation')
        ->and($appointment->xrayReport()->count())->toBe(1);
});

test('individual final evaluation requires only the services selected for that appointment', function () {
    $appointment = clinicalAppointment(['CBC']);
    $medtech = User::factory()->create(['role' => 'medtech']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), cbcPayload());

    $this->actingAs($doctor)->get(route('doctor.final-evaluation', $appointment))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('doctor/final-evaluation')
            ->where('selectedServices', ['CBC']));

    $this->actingAs($doctor)->post(route('doctor.final-evaluation.store', $appointment), [
        'medical_class' => 'A', 'final_remarks' => 'Fit based on selected CBC service.',
    ])->assertSessionHas('success');

    expect($appointment->fresh()->status)->toBe('completed')
        ->and($appointment->physicalExam->classification)->toBe('Class A');
});

test('unselected diagnostics do not block final evaluation while selected xray does', function () {
    $appointment = clinicalAppointment(['X-Ray']);
    $doctor = User::factory()->create(['role' => 'doctor']);

    $this->actingAs($doctor)->post(route('doctor.final-evaluation.store', $appointment), [
        'medical_class' => 'pending', 'final_remarks' => 'Awaiting X-ray.',
    ])->assertSessionHasErrors('medical_class');

    $this->assertDatabaseMissing('physical_exams', ['appointment_id' => $appointment->id]);
});
