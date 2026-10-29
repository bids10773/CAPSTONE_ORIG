<?php

use App\Models\Appointment;
use App\Models\MedicalCertificate;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    Date::setTestNow(\Carbon\CarbonImmutable::parse('2026-10-11 09:30:00', 'Asia/Manila'));
});

afterEach(function (): void {
    Date::setTestNow();
});

function medicalCertificatePatient(array $userOverrides = [], array $profileOverrides = []): User
{
    $patient = User::factory()->create(array_merge([
        'role' => 'patient',
        'first_name' => 'Ana',
        'middle_name' => 'Dela',
        'last_name' => 'Cruz',
        'sex' => 'female',
    ], $userOverrides));

    $patient->patientProfile()->create(array_merge([
        'birthdate' => '2000-10-12',
        'sex' => 'Female',
        'civil_status' => 'Single',
        'address' => 'Cabuyao, Laguna',
    ], $profileOverrides));

    return $patient->fresh('patientProfile');
}

function medicalCertificateDoctor(array $overrides = []): User
{
    return User::factory()->create(array_merge([
        'role' => 'doctor',
        'first_name' => 'Maria',
        'middle_name' => null,
        'last_name' => 'Santos',
        'license_no' => 'PRC-1234567',
        'license_verification_status' => 'verified',
        'is_active' => true,
    ], $overrides));
}

function medicalCertificateConsultation(User $patient, User $doctor, array $overrides = []): Appointment
{
    $appointment = Appointment::create(array_merge([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => '2025-10-11 09:00:00',
        'type' => 'individual',
        'status' => 'completed',
        'service_types' => ['PE'],
        'notes' => 'Persistent fever and headache.',
    ], $overrides));

    $appointment->medicalHistory()->create([
        'medical_examination_id' => $appointment->medicalExamination?->id,
        'present_illness' => 'Persistent fever and headache.',
    ]);
    $appointment->medicalExamination()->update([
        'examining_doctor_id' => $doctor->id,
        'final_diagnosis' => 'Acute viral syndrome.',
        'recommendations' => 'Rest, hydrate, and return if symptoms worsen.',
    ]);

    return $appointment->fresh(['medicalHistory', 'medicalExamination']);
}

function medicalCertificatePayload(User $patient, User $doctor, ?Appointment $appointment = null, array $overrides = []): array
{
    return array_merge([
        'patient_id' => $patient->id,
        'appointment_id' => $appointment?->id,
        'attending_physician_id' => $doctor->id,
        'salutation' => 'Ms.',
        'consultation_date' => $appointment?->appointment_date?->toDateString() ?? '2026-10-11',
        'reason_for_consultation' => 'Persistent fever and headache.',
        'clinical_impression' => 'Acute viral syndrome.',
        'recommendation' => 'Rest, hydrate, and return if symptoms worsen.',
        'rest_start_date' => '2026-10-11',
        'rest_end_date' => '2026-10-13',
    ], $overrides);
}

function medicalCertificateRecord(
    User $patient,
    User $doctor,
    string $status = 'draft',
    int $sequence = 1,
    array $overrides = [],
): MedicalCertificate {
    $issued = in_array($status, ['issued', 'void'], true);

    return MedicalCertificate::create(array_merge([
        'certificate_number' => sprintf('MC-2026-%06d', $sequence),
        'sequence_year' => 2026,
        'sequence_number' => $sequence,
        'patient_id' => $patient->id,
        'attending_physician_id' => $doctor->id,
        'created_by' => $doctor->id,
        'updated_by' => $doctor->id,
        'salutation' => 'Ms.',
        'patient_name' => $patient->name,
        'patient_reference_code' => $patient->patient_reference_code,
        'patient_age' => 25,
        'patient_sex' => 'Female',
        'patient_civil_status' => 'Single',
        'consultation_date' => '2026-10-11',
        'reason_for_consultation' => 'Persistent fever and headache.',
        'clinical_impression' => 'Acute viral syndrome.',
        'recommendation' => 'Rest, hydrate, and return if symptoms worsen.',
        'rest_start_date' => '2026-10-11',
        'rest_end_date' => '2026-10-13',
        'date_issued' => $issued ? '2026-10-11' : null,
        'physician_name' => $doctor->name,
        'physician_license_no' => $doctor->license_no,
        'status' => $status,
        'submitted_at' => $status === 'draft' ? null : now()->subMinutes(20),
        'approved_by' => in_array($status, ['approved', 'issued', 'void'], true) ? $doctor->id : null,
        'approved_at' => in_array($status, ['approved', 'issued', 'void'], true) ? now()->subMinutes(10) : null,
        'issued_by' => $issued ? $doctor->id : null,
        'issued_at' => $issued ? now()->subMinutes(5) : null,
        'voided_by' => $status === 'void' ? $doctor->id : null,
        'voided_at' => $status === 'void' ? now() : null,
    ], $overrides));
}

test('medical certificate routes are limited to authorized clinic roles', function (string $role, bool $allowed) {
    $user = User::factory()->create(['role' => $role]);
    $response = $this->actingAs($user)->get(route('medical-certificates.index'));

    $allowed ? $response->assertOk() : $response->assertForbidden();
})->with([
    'administrator' => ['admin', true],
    'receptionist' => ['receptionist', true],
    'doctor' => ['doctor', true],
    'patient' => ['patient', false],
    'company' => ['company', false],
    'medical technologist' => ['medtech', false],
    'radiologic technologist' => ['radtech', false],
]);

test('guests cannot open the medical certificate module', function () {
    $this->get(route('medical-certificates.index'))->assertRedirect(route('login'));
});

test('automatic generation reuses linked certificates without overwriting their contents', function (string $status) {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $appointment = medicalCertificateConsultation($patient, $doctor, ['examination_purpose' => 'medical_clearance']);
    $appointment->medicalExamination()->update(['finalized_at' => now(), 'finalized_by' => $doctor->id]);
    $existing = medicalCertificateRecord($patient, $doctor, $status, 1, [
        'appointment_id' => $appointment->id, 'recommendation' => 'Keep this reviewed recommendation.',
    ]);
    $service = app(\App\Services\MedicalCertificateWorkflowService::class);
    $request = \Illuminate\Http\Request::create('/doctor/final-evaluation/'.$appointment->id, 'POST');

    $first = $service->generateForFinalizedAppointment($appointment, $doctor, $request);
    $second = $service->generateForFinalizedAppointment($appointment, $doctor, $request);

    expect($first->id)->toBe($existing->id)
        ->and($second->id)->toBe($existing->id)
        ->and($existing->fresh()->status)->toBe($status)
        ->and($existing->fresh()->recommendation)->toBe('Keep this reviewed recommendation.');
    $this->assertDatabaseCount('medical_certificates', 1);
})->with(['draft', 'approved', 'issued', 'void']);

test('automatic draft generation is idempotent and leaves missing patient facts for review', function () {
    $patient = medicalCertificatePatient(['sex' => null], ['sex' => null, 'civil_status' => null]);
    $doctor = medicalCertificateDoctor();
    $appointment = medicalCertificateConsultation($patient, $doctor, ['examination_purpose' => 'medical_clearance']);
    $appointment->medicalExamination()->update(['finalized_at' => now(), 'finalized_by' => $doctor->id, 'recommendations' => null]);
    $service = app(\App\Services\MedicalCertificateWorkflowService::class);
    $request = \Illuminate\Http\Request::create('/doctor/final-evaluation/'.$appointment->id, 'POST');

    $first = $service->generateForFinalizedAppointment($appointment, $doctor, $request);
    $second = $service->generateForFinalizedAppointment($appointment, $doctor, $request);

    expect($first->id)->toBe($second->id)
        ->and($first->salutation)->toBe('')
        ->and($first->patient_sex)->toBeNull()
        ->and($first->patient_civil_status)->toBeNull()
        ->and($first->recommendation)->toBeNull()
        ->and($first->status)->toBe('draft')
        ->and($first->audits()->count())->toBe(1);
    $this->assertDatabaseCount('medical_certificates', 1);
    $this->actingAs($doctor)->patch(route('medical-certificates.submit', $first))
        ->assertSessionHasErrors('salutation');
});

test('certificate appointments cannot be finalized through the examination workflow', function () {
    $patient = medicalCertificatePatient();
    $originalDoctor = medicalCertificateDoctor();
    $finalDoctor = medicalCertificateDoctor();
    $appointment = medicalCertificateConsultation($patient, $originalDoctor, [
        'examination_purpose' => 'medical_clearance', 'status' => 'for_final_evaluation',
    ]);
    $existing = medicalCertificateRecord($patient, $originalDoctor, 'draft', 1, ['appointment_id' => $appointment->id]);
    $appointment->update(['doctor_id' => $finalDoctor->id]);
    $appointment->physicalExam()->create([
        'medical_examination_id' => $appointment->medicalExamination->id,
        'doctor_id' => $originalDoctor->id, 'classification' => 'Pending', 'is_completed' => true,
    ]);

    $this->actingAs($finalDoctor)->post(route('doctor.final-evaluation.store', $appointment), [
        'medical_class' => 'A', 'final_diagnosis' => 'No significant findings.',
    ])->assertForbidden();

    expect($appointment->fresh()->status)->toBe('for_final_evaluation')
        ->and($existing->fresh()->attending_physician_id)->toBe($originalDoctor->id);
    $this->assertDatabaseCount('medical_certificates', 1);
});

test('certificate appointments open the editor without an examination', function () {
    $doctor = medicalCertificateDoctor();
    $patient = medicalCertificatePatient();
    $appointment = medicalCertificateConsultation($patient, $doctor, [
        'examination_purpose' => 'medical_clearance', 'status' => 'arrived',
        'appointment_date' => '2026-10-11',
    ]);
    $this->actingAs($doctor)->get(route('doctor.medical-certificates.prepare', $appointment))
        ->assertRedirect(route('medical-certificates.create', ['patient_id' => $patient->id, 'appointment_id' => $appointment->id]));
    $this->get(route('doctor.physical-exams.create', $appointment))
        ->assertRedirect(route('doctor.medical-certificates.prepare', $appointment));
    $this->get(route('doctor.final-evaluation', $appointment))
        ->assertRedirect(route('doctor.medical-certificates.prepare', $appointment));
    $this->get(route('medical-certificates.create', ['patient_id' => $patient->id, 'appointment_id' => $appointment->id]))
        ->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('medical-certificates/create')
        ->where('selectedPatient.id', $patient->id)
        ->where('selectedConsultationId', $appointment->id));
    expect($appointment->physicalExam)->toBeNull();
});

test('certificate appointment entry reuses existing drafts and rejects other doctors', function () {
    $doctor = medicalCertificateDoctor();
    $patient = medicalCertificatePatient();
    $appointment = medicalCertificateConsultation($patient, $doctor, ['examination_purpose' => 'medical_clearance', 'status' => 'arrived']);
    $certificate = medicalCertificateRecord($patient, $doctor, 'draft', 1, ['appointment_id' => $appointment->id]);
    $this->actingAs($doctor)->get(route('doctor.medical-certificates.prepare', $appointment))
        ->assertRedirect(route('medical-certificates.edit', $certificate));
    $this->actingAs(medicalCertificateDoctor())->get(route('doctor.medical-certificates.prepare', $appointment))
        ->assertForbidden();
    $this->assertDatabaseCount('medical_certificates', 1);
});

test('doctor queue provides certificate entry even when an old examination exists', function () {
    $doctor = medicalCertificateDoctor();
    $patient = medicalCertificatePatient();
    $appointment = medicalCertificateConsultation($patient, $doctor, [
        'examination_purpose' => 'medical_clearance', 'status' => 'for_diagnostics',
        'appointment_date' => '2026-10-10',
    ]);
    $appointment->physicalExam()->create([
        'medical_examination_id' => $appointment->medicalExamination->id,
        'doctor_id' => $doctor->id, 'classification' => 'Pending', 'is_completed' => true,
    ]);
    $this->actingAs($doctor)->get(route('doctor.appointments'))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('doctor/appointments/index')
            ->where('appointments.data.0.id', $appointment->id)
            ->where('appointments.data.0.can_start_physical_exam', false)
            ->where('appointments.data.0.requires_final_evaluation', false)
            ->where('appointments.data.0.certificate_url', route('doctor.medical-certificates.prepare', $appointment)));
});

test('draft preparation leaves the certificate appointment open', function () {
    $doctor = medicalCertificateDoctor();
    $patient = medicalCertificatePatient();
    $appointment = medicalCertificateConsultation($patient, $doctor, ['examination_purpose' => 'medical_clearance', 'status' => 'arrived']);
    $this->actingAs($doctor)->post(route('medical-certificates.store'), medicalCertificatePayload($patient, $doctor, $appointment))
        ->assertSessionHasNoErrors()->assertRedirect();
    expect($appointment->fresh()->status)->toBe('arrived')
        ->and($appointment->medicalExamination->finalized_at)->toBeNull();
});

test('annual examination still requires final evaluation before report release', function () {
    $doctor = medicalCertificateDoctor();
    $patient = medicalCertificatePatient();
    $appointment = medicalCertificateConsultation($patient, $doctor, ['examination_purpose' => 'annual_pe', 'status' => 'arrived']);
    $appointment->physicalExam()->create([
        'medical_examination_id' => $appointment->medicalExamination->id,
        'doctor_id' => $doctor->id, 'classification' => 'Pending', 'is_completed' => true,
    ]);
    app(\App\Services\EmployeeMedicalStatusResolver::class)->resolve($appointment->fresh());
    app(\App\Services\OnsiteEventWorkflowService::class)->refreshFinalEvaluationTask($appointment->fresh());
    expect($appointment->fresh()->status)->toBe('for_final_evaluation')
        ->and($doctor->can('finalizeMedicalEvaluation', $appointment->fresh()))->toBeTrue()
        ->and($doctor->can('releaseMedicalReport', $appointment->fresh()))->toBeFalse();
});

test('issuing a certificate completes its appointment without final evaluation', function () {
    $doctor = medicalCertificateDoctor();
    $patient = medicalCertificatePatient();
    $appointment = medicalCertificateConsultation($patient, $doctor, ['examination_purpose' => 'medical_clearance', 'status' => 'arrived']);
    $certificate = medicalCertificateRecord($patient, $doctor, 'approved', 1, ['appointment_id' => $appointment->id]);
    app(\App\Services\MedicalCertificateWorkflowService::class)->issue($certificate, $doctor, null, \Illuminate\Http\Request::create('/issue', 'PATCH'));
    expect($appointment->fresh()->status)->toBe('completed')
        ->and($appointment->medicalExamination->finalized_at)->toBeNull();
});

test('pre employment and annual purposes allow final evaluation but certificates do not', function (string $purpose, bool $allowed) {
    $doctor = medicalCertificateDoctor();
    $patient = medicalCertificatePatient();
    $appointment = medicalCertificateConsultation($patient, $doctor, ['examination_purpose' => $purpose]);
    expect($doctor->can('finalizeMedicalEvaluation', $appointment))->toBe($allowed);
})->with([['pre_employment', true], ['medical_clearance', false], ['annual_pe', true]]);

test('receptionists and administrators cannot author or submit medical certificate drafts', function (string $role) {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $appointment = medicalCertificateConsultation($patient, $doctor);
    $actor = User::factory()->create(['role' => $role]);
    $certificate = medicalCertificateRecord($patient, $doctor);

    $this->actingAs($actor)
        ->get(route('medical-certificates.create'))
        ->assertForbidden();
    $this->post(
        route('medical-certificates.store'),
        medicalCertificatePayload($patient, $doctor, $appointment),
    )->assertForbidden();
    $this->patch(
        route('medical-certificates.update', $certificate),
        medicalCertificatePayload($patient, $doctor, $appointment),
    )->assertForbidden();
    $this->patch(route('medical-certificates.submit', $certificate))
        ->assertForbidden();

    expect($certificate->fresh()->status)->toBe('draft');
})->with([
    'receptionist' => 'receptionist',
    'administrator' => 'admin',
]);

test('draft creation snapshots trusted patient physician and consultation data', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $appointment = medicalCertificateConsultation($patient, $doctor);

    $payload = medicalCertificatePayload($patient, $doctor, $appointment, [
        // Omit the three clinical narratives so the selected consultation supplies them.
        'reason_for_consultation' => null,
        'clinical_impression' => null,
        'recommendation' => null,
    ]);
    unset($payload['reason_for_consultation'], $payload['clinical_impression'], $payload['recommendation']);

    $this->withServerVariables([
        'REMOTE_ADDR' => '203.0.113.10',
        'HTTP_USER_AGENT' => 'LMIC certificate feature test',
    ])->actingAs($doctor)
        ->post(route('medical-certificates.store'), $payload)
        ->assertRedirect();

    $certificate = MedicalCertificate::query()->sole();

    expect($certificate->certificate_number)->toBe('MC-2026-000001')
        ->and($certificate->status)->toBe('draft')
        ->and($certificate->patient_name)->toBe('Ana Dela Cruz')
        ->and($certificate->patient_reference_code)->toBe($patient->patient_reference_code)
        ->and($certificate->patient_age)->toBe(24)
        ->and($certificate->patient_sex)->toBe('Female')
        ->and($certificate->patient_civil_status)->toBe('Single')
        ->and($certificate->reason_for_consultation)->toBe('Persistent fever and headache.')
        ->and($certificate->clinical_impression)->toBe('Acute viral syndrome.')
        ->and($certificate->recommendation)->toBe('Rest, hydrate, and return if symptoms worsen.')
        ->and($certificate->physician_name)->toBe('Maria Santos')
        ->and($certificate->physician_license_no)->toBe('PRC-1234567');

    $this->assertDatabaseHas('medical_certificate_audits', [
        'medical_certificate_id' => $certificate->id,
        'actor_id' => $doctor->id,
        'action' => 'created',
        'old_status' => null,
        'new_status' => 'draft',
        'ip_address' => '203.0.113.10',
        'user_agent' => 'LMIC certificate feature test',
    ]);

    $patient->update(['first_name' => 'Changed', 'last_name' => 'Name']);
    $patient->patientProfile->update(['sex' => 'Male', 'civil_status' => 'Married']);
    $doctor->update(['license_no' => 'PRC-CHANGED']);
    $appointment->medicalHistory->update(['present_illness' => 'Changed source record']);

    expect($certificate->fresh())
        ->patient_name->toBe('Ana Dela Cruz')
        ->patient_sex->toBe('Female')
        ->patient_civil_status->toBe('Single')
        ->physician_license_no->toBe('PRC-1234567')
        ->reason_for_consultation->toBe('Persistent fever and headache.');
});

test('drafts allow missing demographics but ignore manually supplied physician licenses', function () {
    $patient = medicalCertificatePatient(
        ['sex' => null],
        ['birthdate' => null, 'sex' => null, 'civil_status' => null],
    );
    $doctor = medicalCertificateDoctor([
        'license_no' => null,
        'license_verification_status' => 'not_submitted',
    ]);
    medicalCertificateConsultation($patient, $doctor);

    $this->actingAs($doctor)
        ->post(route('medical-certificates.store'), medicalCertificatePayload($patient, $doctor, null, [
            'patient_age' => 40,
            'patient_sex' => 'Female',
            'patient_civil_status' => 'Single',
            'physician_license_no' => 'PRC-MANUAL-DRAFT',
        ]))
        ->assertRedirect();

    expect(MedicalCertificate::query()->sole())
        ->patient_age->toBe(40)
        ->patient_sex->toBe('Female')
        ->patient_civil_status->toBe('Single')
        ->physician_license_no->toBeNull()
        ->status->toBe('draft');
});

test('editing a draft takes the current physician account license instead of submitted values', function () {
    $doctor = medicalCertificateDoctor(['license_no' => 'PRC-ACCOUNT']);
    $patient = medicalCertificatePatient();
    medicalCertificateConsultation($patient, $doctor);
    $certificate = medicalCertificateRecord($patient, $doctor, 'draft', 1, ['physician_license_no' => 'PRC-OLD']);

    $this->actingAs($doctor)->patch(route('medical-certificates.update', $certificate), medicalCertificatePayload($patient, $doctor, null, [
        'physician_license_no' => 'PRC-MANUAL',
    ]))->assertSessionHasNoErrors();

    expect($certificate->fresh()->physician_license_no)->toBe('PRC-ACCOUNT');
});

test('certificate validation rejects another patients consultation and invalid rest dates', function () {
    $patient = medicalCertificatePatient();
    $otherPatient = medicalCertificatePatient([
        'email' => 'other-patient@example.test',
        'first_name' => 'Other',
    ]);
    $doctor = medicalCertificateDoctor();
    $otherAppointment = medicalCertificateConsultation($otherPatient, $doctor);

    $this->actingAs($doctor)
        ->post(route('medical-certificates.store'), medicalCertificatePayload($patient, $doctor, null, [
            'appointment_id' => $otherAppointment->id,
            'rest_start_date' => '2026-10-13',
            'rest_end_date' => '2026-10-12',
        ]))
        ->assertSessionHasErrors(['appointment_id', 'rest_end_date']);

    $this->assertDatabaseCount('medical_certificates', 0);
});

test('a doctor cannot prepare a certificate for an unassigned patient', function () {
    $patient = medicalCertificatePatient();
    $assignedDoctor = medicalCertificateDoctor();
    $unassignedDoctor = medicalCertificateDoctor([
        'email' => 'unassigned-create-doctor@example.test',
        'license_no' => 'PRC-7654321',
    ]);
    medicalCertificateConsultation($patient, $assignedDoctor);

    $this->actingAs($unassignedDoctor)
        ->post(
            route('medical-certificates.store'),
            medicalCertificatePayload($patient, $unassignedDoctor),
        )
        ->assertSessionHasErrors('patient_id');

    $this->assertDatabaseCount('medical_certificates', 0);
});

test('only the assigned attending physician can approve a submitted certificate', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $otherDoctor = medicalCertificateDoctor([
        'email' => 'other-doctor@example.test',
        'first_name' => 'Other',
        'license_no' => 'PRC-7654321',
    ]);
    $admin = User::factory()->create(['role' => 'admin']);
    $certificate = medicalCertificateRecord($patient, $doctor);

    $this->actingAs($doctor)
        ->patch(route('medical-certificates.submit', $certificate))
        ->assertSessionHas('success');

    expect($certificate->fresh()->status)->toBe('pending_approval');

    $this->actingAs($otherDoctor)
        ->patch(route('medical-certificates.approve', $certificate), ['approval_notes' => 'Approved'])
        ->assertForbidden();
    $this->actingAs($admin)
        ->patch(route('medical-certificates.approve', $certificate), ['approval_notes' => 'Approved'])
        ->assertForbidden();

    $this->actingAs($doctor)
        ->patch(route('medical-certificates.approve', $certificate), ['approval_notes' => 'Reviewed in full.'])
        ->assertSessionHas('success');

    expect($certificate->fresh())
        ->status->toBe('approved')
        ->approved_by->toBe($doctor->id)
        ->approval_notes->toBe('Reviewed in full.');
    $this->assertDatabaseHas('medical_certificate_audits', [
        'medical_certificate_id' => $certificate->id,
        'actor_id' => $doctor->id,
        'action' => 'approved',
        'old_status' => 'pending_approval',
        'new_status' => 'approved',
    ]);
});

test('an assigned physician needs a verified license before approval', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor([
        'license_verification_status' => 'pending',
    ]);
    $certificate = medicalCertificateRecord($patient, $doctor, 'pending_approval');

    $this->actingAs($doctor)
        ->patch(route('medical-certificates.approve', $certificate))
        ->assertForbidden();

    expect($certificate->fresh())
        ->status->toBe('pending_approval')
        ->approved_by->toBeNull()
        ->approved_at->toBeNull();
});

test('certificate can be submitted while the physician license awaits administrator verification', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor(['license_no' => null, 'license_verification_status' => 'not_submitted']);
    $certificate = medicalCertificateRecord($patient, $doctor);

    $this->actingAs($doctor)->patch(route('medical-certificates.submit', $certificate))
        ->assertSessionHasNoErrors()->assertSessionHas('success');

    expect($certificate->fresh()->status)->toBe('pending_approval')
        ->and($certificate->audits()->where('action', 'submitted')->count())->toBe(1);
    $this->patch(route('medical-certificates.approve', $certificate))->assertForbidden();
    $this->patch(route('medical-certificates.issue', $certificate))->assertForbidden();
});

test('approval fills the certificate license after administrator verification', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $certificate = medicalCertificateRecord($patient, $doctor, 'pending_approval', 1, ['physician_license_no' => null]);

    $this->actingAs($doctor)->patch(route('medical-certificates.approve', $certificate))
        ->assertSessionHasNoErrors()->assertSessionHas('success');

    expect($certificate->fresh()->status)->toBe('approved')
        ->and($certificate->fresh()->physician_license_no)->toBe($doctor->license_no);
});

test('submitting without a license still requires the certificate clinical information', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor(['license_no' => null]);
    $certificate = medicalCertificateRecord($patient, $doctor, 'draft', 1, ['clinical_impression' => null]);
    $this->actingAs($doctor)->patch(route('medical-certificates.submit', $certificate))
        ->assertSessionHasErrors('clinical_impression');
    expect($certificate->fresh()->status)->toBe('draft');
});

test('a doctor can save and approve a complete certificate without submitting it', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    medicalCertificateConsultation($patient, $doctor);
    $this->actingAs($doctor)->post(route('medical-certificates.store'), medicalCertificatePayload($patient, $doctor, null, ['save_action' => 'approve']))
        ->assertSessionHasNoErrors()->assertSessionHas('success');
    $certificate = MedicalCertificate::firstOrFail();
    expect($certificate->status)->toBe('approved')
        ->and($certificate->approved_by)->toBe($doctor->id)
        ->and($certificate->issued_at)->toBeNull()
        ->and($patient->notifications()->where('data->type', 'medical_document_status')->count())->toBe(1)
        ->and($certificate->audits()->where('action', 'submitted')->count())->toBe(0)
        ->and($certificate->audits()->where('action', 'approved')->count())->toBe(1);
});

test('save and approve validates completeness and license atomically', function (bool $verified) {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor(['license_verification_status' => $verified ? 'verified' : 'pending']);
    medicalCertificateConsultation($patient, $doctor);
    $this->actingAs($doctor)->post(route('medical-certificates.store'), medicalCertificatePayload($patient, $doctor, null, [
        'save_action' => 'approve', 'clinical_impression' => $verified ? '' : 'Clinical impression',
    ]))->assertSessionHasErrors();
    expect(MedicalCertificate::count())->toBe(0);
})->with([true, false]);

test('save and approve persists draft changes and supports approving an existing draft directly', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    medicalCertificateConsultation($patient, $doctor);
    $certificate = medicalCertificateRecord($patient, $doctor, 'draft');
    $this->actingAs($doctor)->patch(route('medical-certificates.update', $certificate), medicalCertificatePayload($patient, $doctor, null, [
        'save_action' => 'approve', 'recommendation' => 'Updated recommendation',
    ]))->assertSessionHasNoErrors();
    expect($certificate->fresh()->status)->toBe('approved')
        ->and($certificate->fresh()->recommendation)->toBe('Updated recommendation');
    $draft = medicalCertificateRecord($patient, $doctor, 'draft', 2);
    $this->patch(route('medical-certificates.approve', $draft))->assertSessionHasNoErrors();
    expect($draft->fresh()->status)->toBe('approved');
});

test('unverified doctors and receptionists cannot issue certificates', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor(['license_verification_status' => 'pending']);
    $certificate = medicalCertificateRecord($patient, $doctor, 'approved');
    $this->actingAs($doctor)->patch(route('medical-certificates.issue', $certificate))->assertForbidden();
    expect($certificate->fresh()->status)->toBe('approved');

    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $this->actingAs($receptionist)->patch(route('medical-certificates.issue', $certificate))
        ->assertForbidden();
    expect($certificate->fresh()->status)->toBe('approved');
});

test('certificate pickup requires physician issuance before staff can mark ready or release', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $certificate = medicalCertificateRecord($patient, $doctor, 'approved');
    $document = app(\App\Services\MedicalDocumentService::class)->synchronizeCertificate($certificate);
    $document->audits()->create(['actor_id' => $receptionist->id, 'action' => 'reviewed', 'old_status' => 'approved', 'new_status' => 'approved']);
    expect($receptionist->can('markReady', $document))->toBeFalse();
    $document->update(['status' => 'ready_for_pickup']);
    expect($receptionist->can('release', $document->fresh()))->toBeFalse();
    $certificate->update(['status' => 'issued', 'issued_at' => now(), 'issued_by' => $doctor->id]);
    expect($receptionist->can('release', $document->fresh()))->toBeTrue();
    $document->update(['status' => 'approved']);
    expect($receptionist->can('markReady', $document->fresh()))->toBeTrue();
});

test('the attending physician can return a draft for corrections with an audit reason', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $certificate = medicalCertificateRecord($patient, $doctor, 'pending_approval');

    $this->actingAs($doctor)
        ->patch(route('medical-certificates.request-changes', $certificate), [
            'reason' => 'Clarify the recommended rest period.',
        ])
        ->assertSessionHas('success');

    expect($certificate->fresh())
        ->status->toBe('changes_requested')
        ->change_request_reason->toBe('Clarify the recommended rest period.');
    $this->assertDatabaseHas('medical_certificate_audits', [
        'medical_certificate_id' => $certificate->id,
        'actor_id' => $doctor->id,
        'action' => 'changes_requested',
        'old_status' => 'pending_approval',
        'new_status' => 'changes_requested',
    ]);
});

test('the attending doctor can issue only an approved certificate and issuance locks edits', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $certificate = medicalCertificateRecord($patient, $doctor, 'approved');
    $draft = medicalCertificateRecord($patient, $doctor, 'draft', 2);

    $this->actingAs($receptionist)
        ->patch(route('medical-certificates.issue', $draft), ['date_issued' => '2026-10-11'])
        ->assertForbidden();

    $this->actingAs($doctor)
        ->patch(route('medical-certificates.issue', $certificate), ['date_issued' => '2026-10-11'])
        ->assertSessionHas('success');

    expect($certificate->fresh())
        ->status->toBe('issued')
        ->date_issued->toDateString()->toBe('2026-10-11')
        ->issued_by->toBe($doctor->id)
        ->issued_at->not->toBeNull();

    $this->assertDatabaseHas('medical_certificate_audits', [
        'medical_certificate_id' => $certificate->id,
        'actor_id' => $doctor->id,
        'action' => 'issued',
        'old_status' => 'approved',
        'new_status' => 'issued',
    ]);

    $this->actingAs($receptionist)
        ->patch(route('medical-certificates.update', $certificate), medicalCertificatePayload($patient, $doctor))
        ->assertForbidden();
});

test('voiding preserves the issued record and blocks further print or PDF access', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $admin = User::factory()->create(['role' => 'admin']);
    $certificate = medicalCertificateRecord($patient, $doctor, 'issued');

    $this->actingAs($receptionist)
        ->patch(route('medical-certificates.void', $certificate), ['void_reason' => 'Correction required.'])
        ->assertForbidden();

    $this->actingAs($admin)
        ->patch(route('medical-certificates.void', $certificate), ['void_reason' => 'Incorrect issuance details.'])
        ->assertSessionHas('success');

    expect($certificate->fresh())
        ->status->toBe('void')
        ->void_reason->toBe('Incorrect issuance details.')
        ->voided_by->toBe($admin->id)
        ->voided_at->not->toBeNull();
    $this->assertDatabaseHas('medical_certificates', ['id' => $certificate->id, 'status' => 'void']);
    $this->assertDatabaseHas('medical_certificate_audits', [
        'medical_certificate_id' => $certificate->id,
        'actor_id' => $admin->id,
        'action' => 'voided',
        'old_status' => 'issued',
        'new_status' => 'void',
    ]);

    $this->get(route('medical-certificates.print', $certificate))->assertForbidden();
    $this->get(route('medical-certificates.pdf', $certificate))->assertForbidden();
});

test('issued print and PDF responses are private authorized and audited', function () {
    Storage::fake('public');
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor(['signature_path' => 'signatures/doctor.png']);
    Storage::disk('public')->put('signatures/doctor.png', 'SENSITIVE-SIGNATURE-BYTES');
    $otherDoctor = medicalCertificateDoctor([
        'email' => 'unassigned-doctor@example.test',
        'first_name' => 'Unassigned',
        'license_no' => 'PRC-0000002',
    ]);
    $admin = User::factory()->create(['role' => 'admin']);
    $certificate = medicalCertificateRecord($patient, $doctor, 'issued');
    $draft = medicalCertificateRecord($patient, $doctor, 'draft', 2);

    $printResponse = $this->withServerVariables([
        'REMOTE_ADDR' => '203.0.113.40',
        'HTTP_USER_AGENT' => 'LMIC secure print test',
    ])->actingAs($doctor)
        ->get(route('medical-certificates.print', $certificate))
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
        ->assertSee('Living Myth Industrial Clinic')
        ->assertSee('MEDICAL CERTIFICATE')
        ->assertSee('NOTE: This certificate is not for medico-legal purposes.')
        ->assertSee('window.print()', false)
        ->assertDontSee('SENSITIVE-SIGNATURE-BYTES');

    expect($printResponse->headers->get('Cache-Control'))->toContain('no-store');
    $this->assertDatabaseHas('medical_certificate_audits', [
        'medical_certificate_id' => $certificate->id,
        'actor_id' => $doctor->id,
        'action' => 'printed',
        'ip_address' => '203.0.113.40',
        'user_agent' => 'LMIC secure print test',
    ]);

    $pdfResponse = $this->actingAs($admin)
        ->get(route('medical-certificates.pdf', $certificate))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeader('content-disposition', 'attachment; filename=MC-2026-000001.pdf')
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');

    expect($pdfResponse->headers->get('Cache-Control'))->toContain('no-store')
        ->and($pdfResponse->getContent())->toStartWith('%PDF');
    $this->assertDatabaseHas('medical_certificate_audits', [
        'medical_certificate_id' => $certificate->id,
        'actor_id' => $admin->id,
        'action' => 'pdf_downloaded',
    ]);

    $this->actingAs($otherDoctor)
        ->get(route('medical-certificates.print', $certificate))
        ->assertForbidden();
    $this->get(route('medical-certificates.pdf', $certificate))->assertForbidden();
    $this->actingAs($doctor)
        ->get(route('medical-certificates.print', $draft))
        ->assertForbidden();
    $this->get(route('medical-certificates.pdf', $draft))->assertForbidden();
});

test('issued and void records appear in the patient medical history while drafts stay private to the module', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $admin = User::factory()->create(['role' => 'admin']);
    $issued = medicalCertificateRecord($patient, $doctor, 'issued');
    $void = medicalCertificateRecord($patient, $doctor, 'void', 2);
    medicalCertificateRecord($patient, $doctor, 'draft', 3);

    $this->actingAs($admin)
        ->get(route('admin.patients.show', $patient))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/patients/show')
            ->has('medicalCertificates', 2)
            ->where('medicalCertificates.0.id', $void->id)
            ->where('medicalCertificates.0.status', 'void')
            ->where('medicalCertificates.0.pdf_url', null)
            ->where('medicalCertificates.1.id', $issued->id)
            ->where('medicalCertificates.1.status', 'issued'));
});

test('the certificate template matches the paper wording and renders a typical A4 certificate on one page', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $certificate = medicalCertificateRecord($patient, $doctor, 'issued');

    $html = view('pdf.medical-certificate', [
        'certificate' => $certificate,
    ])->render();
    $printHtml = view('medical-certificates.print', [
        'certificate' => $certificate,
    ])->render();

    expect($html)
        ->toContain('size: A4 portrait')
        ->toContain('Living Myth Industrial Clinic')
        ->toContain('2nd Floor, Serafin Business Center, National Highway Banlic, Cabuyao, Laguna')
        ->toContain('Telephone No. (049) 576-0715')
        ->toContain('Certificate No.:')
        ->toContain($certificate->certificate_number)
        ->toContain('Patient Ref.:')
        ->toContain($certificate->patient_reference_code)
        ->not->toContain('Consultation:')
        ->toContain('October 11, 2026')
        ->toContain('To whom it may concern:')
        ->toContain('This is to certify that Ms.')
        ->toContain('IMPRESSION:')
        ->toContain('RECOMMENDATION:')
        ->toContain('Advised to rest from')
        ->toContain('for whatever purpose this may serve the patient.')
        ->toContain('ATTENDING PHYSICIAN')
        ->toContain('LICENSE NO.')
        ->toContain('NOTE: This certificate is not for medico-legal purposes.')
        ->not->toContain('medical cert.jpg')
        ->and($printHtml)->toContain('window.print()');

    $pdf = Pdf::loadView('pdf.medical-certificate', [
        'certificate' => $certificate,
        ...app(\App\Services\CertificateVerificationService::class)->documentData($certificate),
    ])
        ->setPaper('a4', 'portrait');
    $pdf->render();

    expect($pdf->getDomPDF()->getCanvas()->get_page_count())->toBe(1);
});

test('issued certificate print embeds the attending physicians saved signature and handles missing files', function () {
    Storage::fake('public');
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $path = \Illuminate\Http\UploadedFile::fake()->image('physician.png', 320, 100)->store('signatures', 'public');
    $doctor->update(['signature_path' => $path]);
    $certificate = medicalCertificateRecord($patient, $doctor, 'issued');
    $signature = 'data:image/png;base64,'.base64_encode(Storage::disk('public')->get($path));
    $this->actingAs(User::factory()->create(['role' => 'receptionist']))
        ->get(route('medical-certificates.print', $certificate))->assertOk()
        ->assertSee($signature, false)->assertSee('medical-certificate-signature-image', false);
    $this->get(route('medical-certificates.pdf', $certificate))->assertOk()->assertHeader('content-type', 'application/pdf');
    Storage::disk('public')->delete($path);
    $this->get(route('medical-certificates.print', $certificate))->assertOk()->assertDontSee($signature, false);
});

test('draft and void certificate templates do not embed an electronic signature', function (string $status) {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $certificate = medicalCertificateRecord($patient, $doctor, $status);
    $html = view('pdf.medical-certificate', ['certificate' => $certificate, 'signatureDataUri' => 'data:image/png;base64,PRIVATE_SIGNATURE'])->render();
    expect($html)->not->toContain('data:image/png;base64,PRIVATE_SIGNATURE');
})->with(['draft', 'void']);

test('rendered certificate content keeps A4 margins and places section borders below the text', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $certificate = medicalCertificateRecord($patient, $doctor, 'issued', 1, [
        'reason_for_consultation' => str_repeat('The patient reports fever, fatigue, and headache. ', 3),
        'recommendation' => str_repeat('Rest, hydrate, and return if symptoms persist. ', 3),
    ]);
    $pdf = Pdf::loadView('pdf.medical-certificate', [
        'certificate' => $certificate,
        ...app(\App\Services\CertificateVerificationService::class)->documentData($certificate),
    ])->setPaper('a4');
    $boxes = [];
    $pdf->getDomPDF()->setCallbacks([['event' => 'end_frame', 'f' => function ($frame) use (&$boxes): void {
        $node = $frame->get_node();
        if ($node instanceof \DOMElement && $node->hasAttribute('class')) {
            $boxes[$node->getAttribute('class')][] = $frame->get_border_box();
        }
    }]]);
    $pdf->render();
    $sheet = $boxes['medical-certificate-sheet'][0];
    expect($sheet['x'])->toBe(21.0)
        ->and($sheet['y'])->toBe(18.0)
        ->and($sheet['x'] + $sheet['w'])->toBeLessThan(575);
    $header = $boxes['header'][0];
    expect($header['x'] + $header['w'])->toBeLessThanOrEqual($sheet['x'] + $sheet['w'] + 1);
    $blocks = array_merge($boxes['medical-certificate-ruled-block medical-certificate-ruled-block--three'], $boxes['medical-certificate-ruled-block medical-certificate-ruled-block--two']);
    foreach ($boxes['medical-certificate-ruled-value'] as $index => $value) {
        $block = $blocks[$index];
        expect($block['y'] + $block['h'])->toBeGreaterThan($value['y'] + $value['h']);
    }
    $issuedCopy = $boxes['medical-certificate-issued-copy'][0];
    $signature = $boxes['medical-certificate-signature'][0];
    $note = $boxes['medical-certificate-note'][0];
    expect($signature['y'])->toBeGreaterThan($issuedCopy['y'] + $issuedCopy['h'])
        ->and($note['y'])->toBeGreaterThan($signature['y'] + $signature['h'])
        ->and($note['y'] + $note['h'])->toBeLessThan(810);
    expect($pdf->getDomPDF()->getCanvas()->get_page_count())->toBe(1);
});

test('the medical certificate PDF uses the exact laboratory report header', function () {
    $certificate = medicalCertificateRecord(medicalCertificatePatient(), medicalCertificateDoctor(), 'issued');
    $expected = view('pdf.partials.clinic-header')->render();
    $html = view('pdf.medical-certificate', compact('certificate'))->render();
    preg_match('/<div class="header">.*?<\/div>/s', $html, $actual);
    expect(trim(preg_replace('/\s+/', ' ', $actual[0] ?? '')))->toBe(trim(preg_replace('/\s+/', ' ', $expected)));
});

test('laboratory and certificate letterheads render with identical margins typography and spacing', function () {
    $laboratoryHtml = '<html><head><style>'.view('pdf.partials.clinic-styles')->render().'</style></head><body>'.view('pdf.partials.clinic-header')->render().'</body></html>';
    $certificate = medicalCertificateRecord(medicalCertificatePatient(), medicalCertificateDoctor(), 'issued');
    $snapshot = function (string $html): array {
        $pdf = Pdf::loadHTML($html)->setPaper('a4');
        $frames = [];
        $pdf->getDomPDF()->setCallbacks([['event' => 'end_frame', 'f' => function ($frame) use (&$frames): void {
            $node = $frame->get_node();
            if ($node instanceof DOMElement && ($node->getAttribute('class') === 'header'
                || ($node->parentNode instanceof DOMElement && $node->parentNode->getAttribute('class') === 'header'))) {
                $box = $frame->get_border_box();
                $frames[] = [$node->nodeName, round($box['x'], 3), round($box['y'], 3), round($box['w'], 3), round($box['h'], 3), $frame->get_style()->font_size];
            }
        }]]);
        $pdf->render();

        return $frames;
    };
    expect($snapshot(view('pdf.medical-certificate', compact('certificate'))->render()))->toBe($snapshot($laboratoryHtml));
});
