<?php

use App\Enums\InquiryStatus;
use App\Mail\CompanyInvitation;
use App\Mail\InquiryReply;
use App\Mail\StaffTemporaryCredentials;
use App\Models\Company;
use App\Models\Inquiry;
use App\Models\User;
use App\Notifications\WorkflowActivity;
use App\Services\InquiryService;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

test('inquiry replies identify the responder and affected inquiry without copying its private response', function () {
    Mail::fake();
    Notification::fake();
    $admin = User::factory()->create(['first_name' => 'Maya', 'middle_name' => null, 'last_name' => 'Reyes', 'role' => 'admin']);
    $owner = User::factory()->create(['role' => 'patient']);
    $inquiry = Inquiry::create([
        'submission_key' => (string) Str::uuid(), 'user_id' => $owner->id, 'category' => 'general',
        'sender_first_name' => 'Ana', 'sender_last_name' => 'Cruz', 'email' => 'ana@example.test',
        'contact_number' => '09000000000', 'subject' => 'Hours', 'message' => 'Opening hours?',
        'status' => InquiryStatus::Pending,
    ]);
    app(InquiryService::class)->reply($inquiry, 'PRIVATE RESPONSE', $admin);
    Notification::assertSentTo($owner, WorkflowActivity::class, function ($notice) use ($owner, $inquiry) {
        $message = $notice->toDatabase($owner)['message'];
        expect($message)->toContain('Maya Reyes (Administrator)', 'replied', 'INQ-'.str_pad((string) $inquiry->id, 6, '0', STR_PAD_LEFT))
            ->not->toContain('PRIVATE RESPONSE');

        return true;
    });
    $html = (new InquiryReply($inquiry->fresh()))->render();
    expect($html)->toContain('Maya Reyes (Administrator)', 'PRIVATE RESPONSE');
});

test('credential emails identify the actor and do not claim a resend created an account', function () {
    $admin = User::factory()->create(['first_name' => 'Maya', 'middle_name' => null, 'last_name' => 'Reyes', 'role' => 'admin']);
    $staff = User::factory()->create(['role' => 'medtech', 'temporary_password_expires_at' => now()->addDays(2)]);
    $mail = new StaffTemporaryCredentials($staff, 'TemporaryTest123!', $admin);
    $admin->updateQuietly(['first_name' => 'Changed']);
    $html = $mail->render();
    expect($html)->toContain('Maya Reyes (Administrator)', 'temporary sign-in credentials')
        ->not->toContain('administrator created', 'staff account has been created');
    expect($mail->envelope()->subject)->toBe('Staff sign-in credentials | Living Myth Industrial Clinic');
});

test('company credential emails describe the affected company and credential generation', function () {
    $admin = User::factory()->create(['first_name' => 'Maya', 'middle_name' => null, 'last_name' => 'Reyes', 'role' => 'admin']);
    $company = Company::create(['company_name' => 'Example Manufacturing', 'email' => 'company@example.test', 'status' => 'active']);
    $owner = User::factory()->create(['role' => 'company', 'company_id' => $company->id, 'temporary_password_expires_at' => now()->addDays(2)]);
    $html = (new CompanyInvitation($company, $owner, 'TemporaryTest123!', $admin))->render();
    expect($html)->toContain('Maya Reyes (Administrator)', 'Example Manufacturing', 'temporary sign-in credentials')
        ->not->toContain('administrator created your');
});

test('release reversal notices describe the actual reversal rather than marking a document ready', function () {
    Notification::fake();
    $patient = User::factory()->create(['role' => 'patient']);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $admin = User::factory()->create(['first_name' => 'Maya', 'middle_name' => null, 'last_name' => 'Reyes', 'role' => 'admin']);
    $document = \App\Models\MedicalDocument::create([
        'document_number' => 'DOC-REVERSE', 'source_key' => 'test:reverse', 'source_type' => 'test', 'source_id' => 1,
        'patient_id' => $patient->id, 'document_type' => 'laboratory_report', 'title' => 'Laboratory report', 'status' => 'ready_for_pickup',
    ]);
    $service = app(\App\Services\MedicalDocumentService::class);
    $request = \Illuminate\Http\Request::create('/medical-documents', 'POST');
    $document = $service->release($document, $receptionist, ['recipient_type' => 'patient', 'release_method' => 'physical_pickup'], $request);
    $service->reverseRelease($document, $admin, 'PRIVATE REVERSAL REASON', $request);

    Notification::assertSentTo($patient, \App\Notifications\MedicalDocumentStatusChanged::class, function ($notice) use ($patient) {
        $data = $notice->toArray($patient);
        if ($data['title'] !== 'Medical document release reversed') {
            return false;
        }
        expect($data['message'])->toContain('reversed by Maya Reyes (Administrator)', 'ready for pickup')
            ->not->toContain('marked ready', 'PRIVATE REVERSAL REASON');

        return true;
    });
});

test('certificate void synchronization preserves the known voiding actor in the patient notice', function () {
    Notification::fake();
    $patient = User::factory()->create(['role' => 'patient']);
    $actor = User::factory()->create(['first_name' => 'Maya', 'middle_name' => null, 'last_name' => 'Reyes', 'role' => 'admin']);
    $certificate = \App\Models\MedicalCertificate::withoutEvents(fn () => \App\Models\MedicalCertificate::create([
        'certificate_number' => 'MC-2026-001820', 'sequence_year' => 2026, 'sequence_number' => 1820,
        'patient_id' => $patient->id, 'created_by' => $actor->id, 'attending_physician_id' => $actor->id, 'patient_name' => $patient->name, 'salutation' => 'Mr.',
        'consultation_date' => today(), 'status' => 'approved', 'physician_name' => 'Doctor',
    ]));
    $service = app(\App\Services\MedicalDocumentService::class);
    $service->synchronizeCertificate($certificate);
    $certificate->updateQuietly(['status' => 'void', 'voided_by' => $actor->id]);
    $service->synchronizeCertificate($certificate, true, $actor);
    Notification::assertSentTo($patient, \App\Notifications\MedicalDocumentStatusChanged::class, function ($notice) use ($patient) {
        expect($notice->toArray($patient)['message'])->toContain('voided by Maya Reyes (Administrator)');

        return true;
    });
});

test('certificate preparation notices identify the exact submission or correction action', function (string $status, string $phrase) {
    Notification::fake();
    $patient = User::factory()->create(['role' => 'patient']);
    $actor = User::factory()->create(['first_name' => 'Maya', 'middle_name' => null, 'last_name' => 'Reyes', 'role' => 'doctor']);
    $certificate = \App\Models\MedicalCertificate::withoutEvents(fn () => \App\Models\MedicalCertificate::create([
        'certificate_number' => 'MC-2026-001821', 'sequence_year' => 2026, 'sequence_number' => 1821,
        'patient_id' => $patient->id, 'created_by' => $actor->id, 'attending_physician_id' => $actor->id,
        'patient_name' => $patient->name, 'salutation' => 'Mr.', 'consultation_date' => today(),
        'status' => 'approved', 'physician_name' => $actor->name,
    ]));
    $service = app(\App\Services\MedicalDocumentService::class);
    $service->synchronizeCertificate($certificate);
    $certificate->updateQuietly(['status' => $status]);
    $service->synchronizeCertificate($certificate, true, $actor);
    Notification::assertSentTo($patient, \App\Notifications\MedicalDocumentStatusChanged::class, function ($notice) use ($patient, $phrase) {
        expect($notice->toArray($patient)['message'])->toContain($phrase, 'Maya Reyes (Doctor)');

        return true;
    });
})->with([
    ['pending_approval', 'submitted for physician approval'],
    ['changes_requested', 'returned for correction'],
]);
