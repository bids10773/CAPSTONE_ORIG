<?php

use App\Models\Appointment;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

function draftAppointment(array $services = ['PE']): Appointment
{
    $patient = User::factory()->create(['role' => 'patient']);
    PatientProfile::create(['user_id' => $patient->id, 'birthdate' => '1995-01-01', 'sex' => 'Male']);
    $doctor = User::factory()->licensed()->create(['role' => 'doctor', 'is_active' => true]);

    return Appointment::create(['user_id' => $patient->id, 'doctor_id' => $doctor->id,
        'appointment_date' => today(), 'type' => 'individual', 'status' => 'arrived',
        'arrived_at' => now(), 'examination_purpose' => 'pre_employment', 'service_types' => $services]);
}

test('an empty physical examination can be saved and restored without completing it', function () {
    $appointment = draftAppointment();
    $this->actingAs($appointment->doctor)
        ->post(route('doctor.physical-exams.store', $appointment), ['save_action' => 'draft', 'present_illness' => 'History in progress'])
        ->assertSessionHasNoErrors()->assertRedirect();

    expect($appointment->physicalExam()->exists())->toBeFalse()
        ->and($appointment->fresh()->status)->toBe('arrived')
        ->and($appointment->medicalHistory()->exists())->toBeFalse();
    $this->get(route('doctor.physical-exams.create', $appointment))->assertInertia(fn (Assert $page) => $page
        ->where('savedDraft.present_illness', 'History in progress'));
    $this->assertDatabaseHas('clinical_form_audits', ['appointment_id' => $appointment->id,
        'actor_id' => $appointment->doctor_id, 'form_type' => 'physical_exam', 'action' => 'draft_saved']);
});

test('partial vital drafts do not create measurements or resolve a requested recheck', function () {
    $appointment = draftAppointment();
    $staff = User::factory()->create(['role' => 'receptionist']);
    $appointment->vitalSignRecheckRequests()->create(['requested_by' => $appointment->doctor_id,
        'status' => 'pending', 'reason' => 'Repeat reading', 'requested_at' => now()]);
    $this->actingAs($staff)->post(route('receptionist.vital-signs.store', $appointment), [
        'save_action' => 'draft', 'submission_key' => (string) Str::uuid(), 'measurement_type' => 'initial', 'height' => '170',
    ])->assertSessionHasNoErrors()->assertRedirect();

    expect($appointment->vitalSigns()->exists())->toBeFalse()
        ->and($appointment->vitalSignRecheckRequests()->first()->status)->toBe('pending');
    $this->get(route('receptionist.vital-signs.create', $appointment))->assertInertia(fn (Assert $page) => $page
        ->where('savedDraft.height', '170')->where('latestVitalSign', null));
    $otherStaff = User::factory()->create(['role' => 'receptionist']);
    $this->actingAs($otherStaff)->get(route('receptionist.vital-signs.create', $appointment))
        ->assertInertia(fn (Assert $page) => $page->where('savedDraft', null));
});

test('draft saves still reject invalid entered measurements', function () {
    $appointment = draftAppointment();
    $staff = User::factory()->create(['role' => 'receptionist']);
    $this->actingAs($staff)->post(route('receptionist.vital-signs.store', $appointment), [
        'save_action' => 'draft', 'submission_key' => (string) Str::uuid(), 'measurement_type' => 'initial', 'height' => '9999',
    ])->assertSessionHasErrors('height');
    $this->assertDatabaseCount('clinical_form_drafts', 0);
});

test('saving one blood pressure value as draft does not require the other value', function () {
    $appointment = draftAppointment();
    $staff = User::factory()->create(['role' => 'receptionist']);
    $this->actingAs($staff)->post(route('receptionist.vital-signs.store', $appointment), [
        'save_action' => 'draft', 'submission_key' => (string) Str::uuid(), 'measurement_type' => 'initial', 'systolic_pressure' => '120',
    ])->assertSessionHasNoErrors();
    expect($appointment->vitalSigns()->exists())->toBeFalse();
});

test('final evaluation drafts can be saved before results arrive without finalizing the report', function () {
    $appointment = draftAppointment();
    $this->actingAs($appointment->doctor)->post(route('doctor.final-evaluation.store', $appointment), [
        'save_action' => 'draft', 'final_remarks' => 'Awaiting results',
    ])->assertSessionHasNoErrors()->assertRedirect();
    expect($appointment->medicalExamination->fresh()->finalized_at)->toBeNull()
        ->and($appointment->fresh()->status)->toBe('arrived');
    $this->get(route('doctor.final-evaluation', $appointment))->assertInertia(fn (Assert $page) => $page
        ->where('savedDraft.final_remarks', 'Awaiting results'));
    $this->post(route('doctor.final-evaluation.store', $appointment), [])
        ->assertSessionHasErrors(['medical_class', 'final_diagnosis']);
});

test('draft endpoints preserve appointment permissions', function () {
    $appointment = draftAppointment();
    $otherDoctor = User::factory()->licensed()->create(['role' => 'doctor']);
    $this->actingAs($otherDoctor)->post(route('doctor.physical-exams.store', $appointment), ['save_action' => 'draft'])
        ->assertForbidden();
    $this->post(route('doctor.final-evaluation.store', $appointment), ['save_action' => 'draft'])->assertForbidden();
    $this->actingAs($appointment->user)->post(route('receptionist.vital-signs.store', $appointment), ['save_action' => 'draft'])
        ->assertForbidden();
});

test('completing intake still requires measurements and clears only the current authors draft', function () {
    $appointment = draftAppointment();
    $staff = User::factory()->create(['role' => 'receptionist']);
    $key = (string) Str::uuid();
    $base = ['submission_key' => $key, 'measurement_type' => 'initial'];
    $this->actingAs($staff)->post(route('receptionist.vital-signs.store', $appointment), $base + ['save_action' => 'draft'])
        ->assertSessionHasNoErrors();
    $this->post(route('receptionist.vital-signs.store', $appointment), $base)->assertSessionHasErrors(['height', 'visual_acuity']);
    $this->post(route('receptionist.vital-signs.store', $appointment), $base + [
        'systolic_pressure' => 120, 'diastolic_pressure' => 80, 'heart_rate' => 72, 'respiratory_rate' => 16,
        'temperature' => 36.7, 'oxygen_saturation' => 98, 'height' => 170, 'weight' => 65,
        'visual_acuity' => '20/20 OU', 'hearing' => 'Normal bilateral',
    ])->assertSessionHasNoErrors();
    expect($appointment->vitalSigns()->count())->toBe(1);
    $this->assertDatabaseCount('clinical_form_drafts', 0);
});

test('physical completion requires explicit assessments and reasons for unassessed items', function () {
    $appointment = draftAppointment();
    $this->actingAs($appointment->doctor)->post(route('doctor.physical-exams.store', $appointment), [])
        ->assertSessionHasErrors('head_scalp_status');
    $payload = ['vital_signs_override_reason' => 'Urgent consultation before intake'];
    foreach ((new App\Http\Requests\SavePhysicalExamRequest)->bodyParts() as $field) {
        $payload[$field.'_status'] = 'normal';
    }
    $payload['genitals_status'] = 'not_assessed';
    $this->post(route('doctor.physical-exams.store', $appointment), $payload)->assertSessionHasErrors('genitals');
    $payload['genitals'] = 'Patient declined examination';
    $this->post(route('doctor.physical-exams.store', $appointment), $payload)->assertSessionHasNoErrors();
    expect($appointment->physicalExam()->firstOrFail()->genitals)->toBe('Not assessed: Patient declined examination');
});

test('draft save cannot modify a finalized examination', function () {
    $appointment = draftAppointment();
    $appointment->medicalExamination->update(['finalized_at' => now(), 'status' => 'finalized']);
    $this->actingAs($appointment->doctor)->post(route('doctor.physical-exams.store', $appointment), ['save_action' => 'draft'])
        ->assertSessionHasErrors('form');
    $this->post(route('doctor.final-evaluation.store', $appointment), ['save_action' => 'draft'])
        ->assertSessionHasErrors('form');
    $this->assertDatabaseCount('clinical_form_drafts', 0);
});

test('certificate drafts can omit clinical details and salutation but cannot be approved', function () {
    $appointment = draftAppointment();
    $payload = ['save_action' => 'draft', 'patient_id' => $appointment->user_id,
        'appointment_id' => $appointment->id, 'attending_physician_id' => $appointment->doctor_id,
        'consultation_date' => today()->toDateString()];
    $this->actingAs($appointment->doctor)->post('/medical-certificates', $payload)
        ->assertSessionHasNoErrors()->assertRedirect();
    $certificate = App\Models\MedicalCertificate::where('appointment_id', $appointment->id)->firstOrFail();
    expect($certificate->status)->toBe('draft')->and($certificate->clinical_impression)->toBeNull();
    $this->patch(route('medical-certificates.approve', $certificate))
        ->assertSessionHasErrors(['salutation', 'clinical_impression']);
    expect($certificate->fresh()->status)->toBe('draft');
});

test('laboratory drafts accept missing requested values while finalization rejects them', function () {
    $appointment = draftAppointment(['PE', 'CBC']);
    $medtech = User::factory()->licensed()->create(['role' => 'medtech']);
    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), [
        'finalize' => false, 'results' => ['cbc' => ['hemoglobin' => '14.2']],
    ])->assertSessionHasNoErrors();
    expect($appointment->labResult()->firstOrFail()->isFinalized())->toBeFalse();
    $this->post(route('medtech.lab-results.store', $appointment), [
        'finalize' => true, 'results' => ['cbc' => ['hemoglobin' => '14.2']],
    ])->assertSessionHasErrors('results.cbc.hematocrit');
});

test('xray drafts accept missing findings while completion rejects them', function () {
    $appointment = draftAppointment(['PE', 'X-Ray']);
    $radtech = User::factory()->licensed()->create(['role' => 'radtech']);
    $this->actingAs($radtech)->post(route('radtech.xrays.store', $appointment), ['workflow_action' => 'performed'])
        ->assertSessionHasNoErrors();
    expect($appointment->xrayReport()->firstOrFail()->isVerified())->toBeFalse();
    $this->post(route('radtech.xrays.store', $appointment), ['workflow_action' => 'complete'])
        ->assertSessionHasErrors(['chest_status', 'chest_findings', 'impression']);
});

test('an unmeasured vital requires an explicit reason and never becomes a numeric reading', function () {
    $appointment = draftAppointment();
    $staff = User::factory()->create(['role' => 'receptionist']);
    $payload = ['submission_key' => (string) Str::uuid(), 'measurement_type' => 'initial',
        'systolic_pressure' => 120, 'diastolic_pressure' => 80, 'heart_rate' => 72, 'respiratory_rate' => 16,
        'temperature' => 36.7, 'oxygen_saturation' => 98, 'height' => 170,
        'visual_acuity' => '20/20 OU', 'hearing' => 'Normal bilateral',
        'not_assessed' => ['weight' => '']];
    $this->actingAs($staff)->post(route('receptionist.vital-signs.store', $appointment), $payload)
        ->assertSessionHasErrors('not_assessed.weight');
    $payload['not_assessed']['weight'] = 'Unable to stand safely on scale';
    $this->post(route('receptionist.vital-signs.store', $appointment), $payload)->assertSessionHasNoErrors();
    $vital = $appointment->vitalSigns()->firstOrFail();
    expect($vital->weight)->toBeNull()->and($vital->bmi)->toBeNull()
        ->and($vital->not_assessed['weight'])->toBe('Unable to stand safely on scale');
});

test('an unmeasured vital reason cannot contradict a supplied measurement', function () {
    $appointment = draftAppointment();
    $staff = User::factory()->create(['role' => 'receptionist']);
    $this->actingAs($staff)->post(route('receptionist.vital-signs.store', $appointment), [
        'save_action' => 'draft', 'submission_key' => (string) Str::uuid(), 'measurement_type' => 'initial',
        'weight' => '65', 'not_assessed' => ['weight' => 'Not available'],
    ])->assertSessionHasErrors('weight');
});

test('the pre employment report preserves documented unassessed measurements', function () {
    $appointment = draftAppointment();
    $physical = $appointment->physicalExam()->create([
        'medical_examination_id' => $appointment->medicalExamination->id, 'doctor_id' => $appointment->doctor_id,
        'classification' => 'Pending', 'is_completed' => true,
        'vital_signs_not_assessed' => ['weight' => 'Unable to stand safely on scale'],
    ]);
    $html = view('pdf.physical-examination-report', [
        'appointment' => $appointment, 'physical' => $physical, 'history' => null,
        'examination' => $appointment->medicalExamination, 'laboratory' => null, 'xray' => null,
    ])->render();
    expect($html)->toContain('Not assessed: Unable to stand safely on scale');
});

test('a corrected unassessed screening never falls back to an older physical exam reading', function () {
    $appointment = draftAppointment();
    $appointment->physicalExam()->create([
        'medical_examination_id' => $appointment->medicalExamination->id,
        'doctor_id' => $appointment->doctor_id, 'classification' => 'Pending',
        'is_completed' => true, 'visual_acuity' => '20/20 OU', 'hearing' => 'Normal bilateral',
    ]);
    $appointment->vitalSigns()->create([
        'patient_id' => $appointment->user_id, 'submission_key' => (string) Str::uuid(),
        'measurement_type' => 'correction', 'measured_at' => now(),
        'not_assessed' => ['visual_acuity' => 'Equipment unavailable', 'hearing' => 'Patient declined'],
    ]);
    $payload = [];
    foreach ((new App\Http\Requests\SavePhysicalExamRequest)->bodyParts() as $field) {
        $payload[$field.'_status'] = 'normal';
    }
    $this->actingAs($appointment->doctor)->post(route('doctor.physical-exams.store', $appointment), $payload)
        ->assertSessionHasNoErrors();
    $physical = $appointment->physicalExam()->firstOrFail();
    expect($physical->visual_acuity)->toBeNull()->and($physical->hearing)->toBeNull()
        ->and($physical->blood_pressure)->toBeNull()
        ->and($physical->vital_signs_not_assessed['hearing'])->toBe('Patient declined');
});
