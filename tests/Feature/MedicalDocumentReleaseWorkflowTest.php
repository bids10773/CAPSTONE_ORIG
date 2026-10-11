<?php

use App\Models\MedicalDocument;
use App\Models\User;
use App\Notifications\MedicalDocumentStatusChanged;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

function releaseDocument(User $patient, string $status = 'approved'): MedicalDocument
{
    return MedicalDocument::create([
        'document_number' => 'DOC-TEST-'.fake()->unique()->numerify('####'),
        'source_key' => 'test:'.fake()->uuid(),
        'source_type' => 'test',
        'source_id' => fake()->numberBetween(1, 100000),
        'patient_id' => $patient->id,
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

test('receptionist records pickup and representative verification with notifications', function () {
    Notification::fake();
    $patient = User::factory()->create(['role' => 'patient']);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $document = releaseDocument($patient);

    $this->actingAs($receptionist)->patch(route('medical-documents.ready', $document))->assertRedirect();
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
