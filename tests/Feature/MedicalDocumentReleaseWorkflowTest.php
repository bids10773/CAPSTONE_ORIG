<?php

use App\Models\Appointment;
use App\Models\MedicalDocument;
use App\Models\User;
use App\Notifications\MedicalDocumentStatusChanged;
use App\Services\MedicalDocumentService;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

function releaseDocument(User $patient, string $status = 'approved', ?Appointment $appointment = null): MedicalDocument
{
    return MedicalDocument::create([
        'document_number' => 'DOC-TEST-'.fake()->unique()->numerify('####'),
        'source_key' => 'test:'.fake()->uuid(),
        'source_type' => 'test',
        'source_id' => fake()->numberBetween(1, 100000),
        'patient_id' => $patient->id,
        'appointment_id' => $appointment?->id,
        'document_type' => 'laboratory_report',
        'title' => 'Laboratory Report',
        'related_service' => 'CBC',
        'status' => $status,
        'requested_at' => now(),
        'release_instructions' => config('medical.document_release.instructions'),
    ]);
}

test('patient portal exposes only the patients document status metadata', function () {
    $patient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    $other = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    releaseDocument($patient, 'ready_for_pickup');
    releaseDocument($other, 'ready_for_pickup');

    $this->actingAs($patient)->get(route('medical-documents.patient'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('medical-documents/patient')
            ->has('documents', 1)
            ->where('documents.0.title', 'Laboratory Report')
            ->where('documents.0.status', 'ready_for_pickup')
            ->missing('documents.0.pdf_url')
            ->missing('documents.0.findings')
            ->missing('documents.0.results'));
});

test('non-downloadable medical documents do not expose a download link', function (string $status) {
    $patient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    $admin = User::factory()->create(['role' => 'admin']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['CBC'],
    ]);
    $document = releaseDocument($patient, $status, $appointment);

    $this->actingAs($admin)->get(route('medical-documents.index', ['search' => $document->document_number]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('documents.data', 1)
            ->where('documents.data.0.status', $status)
            ->where('documents.data.0.pdf_url', null));
})->with(['pending', 'cancelled']);

test('laboratory document lists only requested laboratory services', function () {
    $patient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['CBC', 'Urinalysis', 'Fecalysis', 'X-Ray', 'Drug Test'],
    ]);

    app(MedicalDocumentService::class)->synchronizeAppointment($appointment);

    expect(MedicalDocument::where([
        'appointment_id' => $appointment->id,
        'document_type' => 'laboratory_report',
    ])->value('related_service'))->toBe('CBC, Urinalysis, Fecalysis, Drug Test');
});

test('pe package registers one complete report instead of separate laboratory and xray documents', function () {
    $patient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['PE', 'CBC', 'Urinalysis', 'X-Ray'],
    ]);

    app(MedicalDocumentService::class)->synchronizeAppointment($appointment);

    expect($appointment->medicalDocuments()->count())->toBe(1)
        ->and($appointment->medicalDocuments()->first()->title)->toBe('Complete Medical Examination Report');

    foreach (['laboratory_report', 'xray_report'] as $type) {
        MedicalDocument::create([
            'document_number' => 'DOC-LEGACY-'.fake()->unique()->numerify('####'),
            'source_key' => "legacy:{$appointment->id}:{$type}",
            'source_type' => 'appointment',
            'source_id' => $appointment->id,
            'patient_id' => $patient->id,
            'appointment_id' => $appointment->id,
            'document_type' => $type,
            'title' => $type === 'laboratory_report' ? 'Laboratory Report' : 'Chest X-Ray Report',
            'related_service' => $type === 'laboratory_report' ? 'CBC, Urinalysis' : 'X-Ray',
            'status' => 'pending',
            'requested_at' => now(),
        ]);
    }

    $this->actingAs($receptionist)
        ->get(route('medical-documents.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('documents.data', 1)
            ->where('documents.data.0.title', 'Complete Medical Examination Report'));
});

test('receptionist can review a finalized complete medical examination report', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'completed',
        'service_types' => ['PE'],
    ]);
    $examination = $appointment->medicalExamination;
    $examination->update([
        'examining_doctor_id' => $doctor->id,
        'finalized_by' => $doctor->id,
        'finalized_at' => now(),
        'status' => 'finalized',
    ]);
    $appointment->physicalExam()->create([
        'medical_examination_id' => $examination->id,
        'doctor_id' => $doctor->id,
        'classification' => 'Pending',
        'is_completed' => true,
    ]);

    app(MedicalDocumentService::class)->synchronizeAppointment($appointment->fresh());

    $this->actingAs($receptionist)
        ->get(route('clinical-forms.physical-exam.pdf', ['appointment' => $appointment, 'preview' => 1]))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

test('complete pe report is available only after every required document is ready for pickup', function () {
    $patient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'completed',
        'service_types' => ['PE', 'CBC', 'X-Ray'],
    ]);
    app(MedicalDocumentService::class)->synchronizeAppointment($appointment);
    $this->actingAs($patient)
        ->get(route('appointments.show', $appointment))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('completePeReadyForPickup', false));

    $appointment->medicalDocuments()->update(['status' => 'ready_for_pickup']);

    $this->get(route('appointments.show', $appointment))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('completePeReadyForPickup', true));
});

test('receptionist marks and releases a complete pe package with one action', function () {
    Notification::fake();
    $patient = User::factory()->create(['role' => 'patient']);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'completed',
        'service_types' => ['PE', 'CBC', 'X-Ray'],
    ]);
    app(MedicalDocumentService::class)->synchronizeAppointment($appointment);
    $appointment->medicalDocuments()->update(['status' => 'approved']);
    $completePe = $appointment->medicalDocuments()->where('document_type', 'physical_examination')->firstOrFail();

    $this->actingAs($receptionist)
        ->patch(route('medical-documents.review', $completePe))
        ->assertRedirect();
    $this
        ->patch(route('medical-documents.ready', $completePe))
        ->assertRedirect();
    expect($completePe->fresh()->status)->toBe('ready_for_pickup');

    $this->post(route('medical-documents.release', $completePe), [
        'recipient_type' => 'patient',
        'release_method' => 'physical_pickup',
    ])->assertRedirect();
    expect($completePe->fresh()->status)->toBe('released')
        ->and($completePe->releases()->count())->toBe(1);
});

test('patient can scope medical records to one owned appointment', function () {
    $patient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    $selected = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today()->subDay(),
        'type' => 'individual',
        'status' => 'completed',
        'service_types' => [],
    ]);
    $other = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'completed',
        'service_types' => [],
    ]);
    $selectedDocument = releaseDocument($patient, 'released', $selected);
    releaseDocument($patient, 'released', $other);

    $this->actingAs($patient)
        ->get(route('medical-documents.patient', ['appointment' => $selected]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('medical-documents/patient')
            ->has('documents', 1)
            ->where('documents.0.id', $selectedDocument->id)
            ->where('documents.0.appointment.id', $selected->id)
            ->where('selectedAppointment.id', $selected->id)
            ->where('selectedAppointment.reference_code', $selected->reference_code));
});

test('patient cannot scope medical records to another patients appointment', function () {
    $patient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    $otherPatient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    $otherAppointment = Appointment::create([
        'user_id' => $otherPatient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'completed',
        'service_types' => [],
    ]);

    $this->actingAs($patient)
        ->get(route('medical-documents.patient', ['appointment' => $otherAppointment]))
        ->assertNotFound();
});

test('receptionist records pickup and representative verification with notifications', function () {
    Notification::fake();
    $patient = User::factory()->create(['role' => 'patient']);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $document = releaseDocument($patient);

    $this->actingAs($receptionist)->patch(route('medical-documents.ready', $document))->assertForbidden();
    $this->patch(route('medical-documents.review', $document))->assertRedirect();
    $this->patch(route('medical-documents.ready', $document))->assertRedirect();
    expect($document->fresh()->status)->toBe('ready_for_pickup');

    $this->post(route('medical-documents.release', $document), [
        'recipient_type' => 'authorized_representative',
        'recipient_name' => 'Juan Dela Cruz',
        'representative_verification' => 'Government ID and signed authorization checked',
        'release_method' => 'physical_pickup',
        'remarks' => 'Claimed at front desk',
    ])->assertRedirect();

    expect($document->fresh()->status)->toBe('released')
        ->and($document->releases()->first()->recipient_name)->toBe('Juan Dela Cruz')
        ->and($document->audits()->where('action', 'released')->exists())->toBeTrue();
    Notification::assertSentTo($patient, MedicalDocumentStatusChanged::class);
});

test('representative release requires identity verification', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $document = releaseDocument($patient, 'ready_for_pickup');

    $this->actingAs($receptionist)->post(route('medical-documents.release', $document), [
        'recipient_type' => 'authorized_representative', 'recipient_name' => 'Representative',
        'release_method' => 'physical_pickup',
    ])->assertSessionHasErrors('representative_verification');
    expect($document->fresh()->status)->toBe('ready_for_pickup');
});

test('only an administrator can reverse a release and the history remains auditable', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $admin = User::factory()->create(['role' => 'admin']);
    $document = releaseDocument($patient, 'ready_for_pickup');
    $this->actingAs($receptionist)->post(route('medical-documents.release', $document), [
        'recipient_type' => 'patient', 'release_method' => 'physical_pickup',
    ]);

    $this->patch(route('medical-documents.release.reverse', $document), ['reason' => 'Wrong recipient recorded'])->assertForbidden();
    $this->actingAs($admin)->patch(route('medical-documents.release.reverse', $document), ['reason' => 'Wrong recipient recorded'])->assertRedirect();

    expect($document->fresh()->status)->toBe('ready_for_pickup')
        ->and($document->releases()->first()->reversed_at)->not->toBeNull()
        ->and($document->audits()->where('action', 'release_reversed')->exists())->toBeTrue();
});

test('clinical staff cannot perform administrative release actions', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $document = releaseDocument($patient);
    $this->actingAs($doctor)->patch(route('medical-documents.ready', $document))->assertForbidden();
});
