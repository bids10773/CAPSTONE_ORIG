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

test('attending physician can complete missing demographic and license details on a draft', function () {
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
        ->physician_license_no->toBe('PRC-MANUAL-DRAFT')
        ->status->toBe('draft');
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

test('authorized staff can issue only an approved certificate and issuance locks edits', function () {
    $patient = medicalCertificatePatient();
    $doctor = medicalCertificateDoctor();
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $certificate = medicalCertificateRecord($patient, $doctor, 'approved');
    $draft = medicalCertificateRecord($patient, $doctor, 'draft', 2);

    $this->actingAs($receptionist)
        ->patch(route('medical-certificates.issue', $draft), ['date_issued' => '2026-10-11'])
        ->assertForbidden();

    $this->actingAs($receptionist)
        ->patch(route('medical-certificates.issue', $certificate), ['date_issued' => '2026-10-11'])
        ->assertSessionHas('success');

    expect($certificate->fresh())
        ->status->toBe('issued')
        ->date_issued->toDateString()->toBe('2026-10-11')
        ->issued_by->toBe($receptionist->id)
        ->issued_at->not->toBeNull();

    $this->assertDatabaseHas('medical_certificate_audits', [
        'medical_certificate_id' => $certificate->id,
        'actor_id' => $receptionist->id,
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
        ->assertSee('Living Myth Medical Clinic')
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
    $signatureSentinel = 'data:image/png;base64,SENSITIVE-SIGNATURE-SHOULD-NOT-RENDER';

    $html = view('pdf.medical-certificate', [
        'certificate' => $certificate,
        'signatureDataUri' => $signatureSentinel,
    ])->render();
    $printHtml = view('medical-certificates.print', [
        'certificate' => $certificate,
        'signatureDataUri' => $signatureSentinel,
    ])->render();

    expect($html)
        ->toContain('size: A4 portrait')
        ->toContain('Living Myth Medical Clinic')
        ->toContain('2nd Floor, Serafin Business Center, National Highway Banlic, Cabuyao, Laguna')
        ->toContain('Mobile No. 0920-631-11-30')
        ->toContain('Certificate No.:')
        ->toContain($certificate->certificate_number)
        ->toContain('Patient Ref.:')
        ->toContain($certificate->patient_reference_code)
        ->toContain('Consultation:')
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
        ->not->toContain('SENSITIVE-SIGNATURE-SHOULD-NOT-RENDER')
        ->and($printHtml)->toContain('window.print()')
        ->not->toContain('SENSITIVE-SIGNATURE-SHOULD-NOT-RENDER');

    $pdf = Pdf::loadView('pdf.medical-certificate', ['certificate' => $certificate])
        ->setPaper('a4', 'portrait');
    $pdf->render();

    expect($pdf->getDomPDF()->getCanvas()->get_page_count())->toBe(1);
});
