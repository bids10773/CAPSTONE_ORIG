<?php

use App\Models\Appointment;
use App\Models\ClinicalFormAudit;
use App\Models\PatientProfile;
use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

function vitalSignsAppointment(): Appointment
{
    $patient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    PatientProfile::create(['user_id' => $patient->id, 'birthdate' => '1995-01-01', 'sex' => 'Male',
        'civil_status' => 'Single', 'address' => 'Test address']);
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);

    return Appointment::create(['user_id' => $patient->id, 'doctor_id' => $doctor->id,
        'appointment_date' => today(), 'start_time' => '09:00', 'end_time' => '09:30',
        'type' => 'individual', 'status' => 'arrived', 'arrived_at' => now(), 'service_types' => ['PE']]);
}

function vitalSignsPayload(?string $key = null, array $overrides = []): array
{
    return [...[
        'submission_key' => $key ?? (string) Str::uuid(), 'measurement_type' => 'initial',
        'systolic_pressure' => 120, 'diastolic_pressure' => 80, 'heart_rate' => 72,
        'respiratory_rate' => 16, 'temperature' => 36.7, 'oxygen_saturation' => 98,
        'height' => 170, 'weight' => 65, 'notes' => 'Patient comfortable at rest.',
        'visual_acuity' => '20/20 OU', 'hearing' => 'Normal bilateral',
    ], ...$overrides];
}

function doctorAssessmentPayload(array $overrides = []): array
{
    $bodyParts = ['head_scalp', 'eyes', 'ears', 'nose_sinuses', 'mouth_throat', 'neck_thyroid',
        'chest_breast', 'lungs', 'heart', 'abdomen', 'back', 'anus', 'genitals', 'extremities', 'skin', 'dental'];
    $payload = [];
    foreach ($bodyParts as $part) {
        $payload["{$part}_status"] = 'normal';
        $payload[$part] = null;
    }

    return [...$payload, ...$overrides];
}

test('receptionist records encounter vital signs with calculated bmi and audit attribution', function () {
    $appointment = vitalSignsAppointment();
    $receptionist = User::factory()->create(['role' => 'receptionist']);

    $this->actingAs($receptionist)->post(route('receptionist.vital-signs.store', $appointment), vitalSignsPayload())
        ->assertRedirect(route('receptionist.queue.index'));

    $vital = VitalSign::firstOrFail();
    expect($vital->patient_id)->toBe($appointment->user_id)
        ->and($vital->appointment_id)->toBe($appointment->id)
        ->and($vital->recorded_by)->toBe($receptionist->id)
        ->and((float) $vital->bmi)->toBe(22.5)
        ->and($vital->visual_acuity)->toBe('20/20 OU')
        ->and($vital->hearing)->toBe('Normal bilateral')
        ->and($vital->measured_at)->not->toBeNull()
        ->and(ClinicalFormAudit::where('form_type', 'vital_signs')->where('action', 'recorded')->exists())->toBeTrue();
});

test('patient doctor and administrator cannot record receptionist intake measurements', function (string $role) {
    $appointment = vitalSignsAppointment();
    $actor = $role === 'patient' ? $appointment->user : User::factory()->create(['role' => $role]);
    $this->actingAs($actor)->post(route('receptionist.vital-signs.store', $appointment), vitalSignsPayload())->assertForbidden();
})->with(['patient', 'doctor', 'admin']);

test('submission keys prevent accidental duplicate vital sign records', function () {
    $appointment = vitalSignsAppointment();
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $key = (string) Str::uuid();
    $this->actingAs($receptionist)->post(route('receptionist.vital-signs.store', $appointment), vitalSignsPayload($key));
    $this->post(route('receptionist.vital-signs.store', $appointment), vitalSignsPayload($key));
    expect(VitalSign::count())->toBe(1);
});

test('rechecks append a new reading and resolve the doctors documented request', function () {
    $appointment = vitalSignsAppointment();
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $this->actingAs($receptionist)->post(route('receptionist.vital-signs.store', $appointment), vitalSignsPayload());
    $first = VitalSign::firstOrFail();

    $this->actingAs($appointment->doctor)->post(route('doctor.vital-signs.recheck', $appointment), ['reason' => 'Repeat after five minutes of rest'])->assertRedirect();
    $this->actingAs($receptionist)->post(route('receptionist.vital-signs.store', $appointment), vitalSignsPayload(null, [
        'measurement_type' => 'recheck', 'supersedes_id' => $first->id, 'systolic_pressure' => 116,
    ]))->assertRedirect();

    expect(VitalSign::count())->toBe(2)
        ->and($appointment->vitalSignRecheckRequests()->first()->status)->toBe('resolved')
        ->and($first->fresh()->systolic_pressure)->toBe(120);
});

test('doctor sees receptionist readings and malicious vital edits are ignored during assessment', function () {
    $appointment = vitalSignsAppointment();
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $this->actingAs($receptionist)->post(route('receptionist.vital-signs.store', $appointment), vitalSignsPayload());

    $this->actingAs($appointment->doctor)->get(route('doctor.physical-exams.create', $appointment))
        ->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('latestVitalSign.systolic_pressure', 120)
        ->where('latestVitalSign.recorded_by.id', $receptionist->id));

    $this->post(route('doctor.physical-exams.store', $appointment), doctorAssessmentPayload([
        'height' => 100, 'weight' => 400, 'systolic_pressure' => 250, 'diastolic_pressure' => 150,
        'visual_acuity' => 'Forged vision result', 'hearing' => 'Forged hearing result',
    ]))->assertRedirect();
    $physical = $appointment->physicalExam()->firstOrFail();
    expect((float) $physical->height)->toBe(170.0)
        ->and((float) $physical->weight)->toBe(65.0)
        ->and($physical->blood_pressure)->toBe('120/80')
        ->and($physical->visual_acuity)->toBe('20/20 OU')
        ->and($physical->hearing)->toBe('Normal bilateral');
});

test('new intake requires valid vision and hearing screening results', function (string $field, mixed $value) {
    $appointment = vitalSignsAppointment();
    $receptionist = User::factory()->create(['role' => 'receptionist']);

    $this->actingAs($receptionist)->post(route('receptionist.vital-signs.store', $appointment),
        vitalSignsPayload(null, [$field => $value]))
        ->assertSessionHasErrors($field);

    expect($appointment->vitalSigns()->exists())->toBeFalse();
})->with([
    ['visual_acuity', null], ['hearing', '   '],
    ['visual_acuity', str_repeat('x', 101)], ['hearing', str_repeat('x', 101)],
]);

test('screening rechecks retain history and supply the latest results to the physical exam', function () {
    $appointment = vitalSignsAppointment();
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $this->actingAs($receptionist)->post(route('receptionist.vital-signs.store', $appointment), vitalSignsPayload());
    $first = $appointment->vitalSigns()->firstOrFail();
    $this->travel(1)->minutes();
    $this->post(route('receptionist.vital-signs.store', $appointment), vitalSignsPayload(null, [
        'measurement_type' => 'recheck', 'supersedes_id' => $first->id,
        'visual_acuity' => '20/30 OU', 'hearing' => 'Reduced right ear',
    ]))->assertSessionHasNoErrors();

    $this->actingAs($appointment->doctor)->get(route('doctor.physical-exams.create', $appointment))
        ->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('latestVitalSign.visual_acuity', '20/30 OU')
        ->where('latestVitalSign.hearing', 'Reduced right ear'));
    $this->post(route('doctor.physical-exams.store', $appointment), doctorAssessmentPayload())
        ->assertSessionHasNoErrors();

    expect($first->fresh()->visual_acuity)->toBe('20/20 OU')
        ->and($first->fresh()->hearing)->toBe('Normal bilateral')
        ->and($appointment->physicalExam()->firstOrFail()->visual_acuity)->toBe('20/30 OU')
        ->and($appointment->physicalExam()->firstOrFail()->hearing)->toBe('Reduced right ear');
});

test('urgent doctor override requires a reason and is audited without invented measurements', function () {
    $appointment = vitalSignsAppointment();
    $this->actingAs($appointment->doctor)->post(route('doctor.physical-exams.store', $appointment), doctorAssessmentPayload())
        ->assertSessionHasErrors('vital_signs_override_reason');

    $this->post(route('doctor.physical-exams.store', $appointment), doctorAssessmentPayload([
        'vital_signs_override_reason' => 'Immediate emergency assessment was clinically necessary.',
    ]))->assertRedirect();
    expect($appointment->physicalExam()->first()->blood_pressure)->toBeNull()
        ->and($appointment->physicalExam()->first()->visual_acuity)->toBeNull()
        ->and($appointment->physicalExam()->first()->hearing)->toBeNull()
        ->and(ClinicalFormAudit::where('form_type', 'vital_signs')->where('action', 'urgent_override')->exists())->toBeTrue();
});

test('older intake without screening results preserves existing physical exam findings', function () {
    $appointment = vitalSignsAppointment();
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $appointment->vitalSigns()->create([
        ...collect(vitalSignsPayload())->except(['visual_acuity', 'hearing'])->all(),
        'patient_id' => $appointment->user_id, 'recorded_by' => $receptionist->id, 'measured_at' => now(),
    ]);
    $appointment->physicalExam()->create([
        'doctor_id' => $appointment->doctor_id, 'classification' => 'Pending',
        'visual_acuity' => 'Historical vision', 'hearing' => 'Historical hearing',
    ]);

    $this->actingAs($appointment->doctor)
        ->post(route('doctor.physical-exams.store', $appointment), doctorAssessmentPayload())
        ->assertSessionHasNoErrors();

    expect($appointment->physicalExam()->firstOrFail()->visual_acuity)->toBe('Historical vision')
        ->and($appointment->physicalExam()->firstOrFail()->hearing)->toBe('Historical hearing');
});

test('each selected service requires a physical exam after vitals', function (string $service, string $nextStatus) {
    $appointment = vitalSignsAppointment();
    $appointment->update(['service_types' => [$service]]);
    if ($service === 'Pregnancy Test') {
        $appointment->user->patientProfile->update(['sex' => 'Female']);
    }
    $receptionist = User::factory()->create(['role' => 'receptionist']);

    $this->actingAs($receptionist)
        ->post(route('receptionist.vital-signs.store', $appointment), vitalSignsPayload())
        ->assertSessionHasNoErrors();

    $this->actingAs($appointment->doctor)
        ->get(route('doctor.physical-exams.create', $appointment))
        ->assertOk();
    $this->post(route('doctor.physical-exams.store', $appointment), doctorAssessmentPayload())
        ->assertSessionHasNoErrors();

    expect($appointment->fresh()->status)->toBe($nextStatus)
        ->and($appointment->fresh()->service_types)->toBe([$service])
        ->and($appointment->physicalExam()->firstOrFail()->is_completed)->toBeTrue();
})->with([
    ['PE', 'for_final_evaluation'],
    ['CBC', 'for_diagnostics'],
    ['Urinalysis', 'for_diagnostics'],
    ['Fecalysis', 'for_diagnostics'],
    ['Drug Test', 'for_diagnostics'],
    ['Hepatitis', 'for_diagnostics'],
    ['Blood Typing', 'for_diagnostics'],
    ['FBS', 'for_diagnostics'],
    ['Blood Chemistry', 'for_diagnostics'],
    ['Pregnancy Test', 'for_diagnostics'],
    ['X-Ray', 'for_xray'],
]);
