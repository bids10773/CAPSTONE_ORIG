<?php

use App\Models\Appointment;
use App\Models\CompanyReferral;
use App\Models\DoctorAvailabilityChangeRequest;
use App\Models\Inquiry;
use App\Models\MedicalDocument;
use App\Models\User;
use App\Notifications\AppointmentAssigned;
use App\Notifications\AppointmentAutoCancelled;
use App\Notifications\AppointmentCancelled;
use App\Notifications\AppointmentConfirmed;
use App\Notifications\AppointmentRejected;
use App\Notifications\AppointmentReminder;
use App\Notifications\AppointmentSubmitted;
use App\Notifications\CompanyMedicalReferralInvitation;
use App\Notifications\DoctorAvailabilityChangeRequested;
use App\Notifications\DoctorScheduleChanged;
use App\Notifications\DoctorScheduleChangePending;
use App\Notifications\MedicalDocumentStatusChanged;
use App\Notifications\MedicalReportReleased;
use App\Notifications\NewAppointmentRequest;
use App\Notifications\NewInquirySubmitted;
use App\Notifications\OnsiteStaffAssigned;

function wordingAppointment(): Appointment
{
    $appointment = new Appointment(['appointment_date' => '2026-11-06']);
    $appointment->id = 182;
    $appointment->setRelation('doctor', null);
    $appointment->setRelation('user', null);

    return $appointment;
}

test('appointment decisions capture the real event actor before delivery', function () {
    $actor = User::factory()->create(['first_name' => 'Maya', 'middle_name' => null, 'last_name' => 'Reyes', 'role' => 'admin']);
    $appointment = wordingAppointment();
    $notification = new AppointmentConfirmed($appointment, $actor);
    $actor->first_name = 'Changed';
    $this->actingAs(User::factory()->create(['role' => 'receptionist']));

    expect($notification->toDatabase($actor)['message'])->toBe('Your appointment APT0182 for Nov 6, 2026 was confirmed by Maya Reyes (Administrator).')
        ->and($notification->toMail($actor)->introLines[0])->toBe('Your appointment APT0182 for Nov 6, 2026 was confirmed by Maya Reyes (Administrator).');
});

test('manual cancellation does not reuse an earlier processor or invent an actor', function () {
    $appointment = wordingAppointment();
    $appointment->processed_by = User::factory()->create(['role' => 'admin'])->id;
    $recipient = User::factory()->make();

    $notification = new AppointmentCancelled($appointment);
    expect($notification->toDatabase($recipient)['message'])
        ->toBe('Your appointment APT0182 for Nov 6, 2026 was cancelled.')
        ->and($notification->toMail($recipient)->introLines[0])->toBe($notification->toDatabase($recipient)['message']);
});

test('automatic expiry explicitly identifies the system and schedule expiry reason', function () {
    $appointment = wordingAppointment();
    $appointment->cancellation_reason = 'schedule_expired';
    $recipient = User::factory()->make();
    $notification = new AppointmentAutoCancelled($appointment);

    expect($notification->toDatabase($recipient)['message'])->toBe('The system cancelled your appointment APT0182 for Nov 6, 2026 because the appointment schedule expired before check-in.')
        ->and($notification->toMail($recipient)->introLines[0])->toBe($notification->toDatabase($recipient)['message']);
});

test('report forwarding is a handoff and retains the doctor identity after serialization', function () {
    $doctor = User::factory()->make(['first_name' => 'Ada', 'middle_name' => null, 'last_name' => 'Cruz', 'role' => 'doctor']);
    $notification = unserialize(serialize(new MedicalReportReleased(wordingAppointment(), $doctor)));
    $recipient = User::factory()->make();

    expect($notification->toDatabase($recipient)['title'])->toBe('Medical report forwarded to reception')
        ->and($notification->toDatabase($recipient)['message'])->toBe('Your medical report for appointment APT0182 was forwarded to reception for collection preparation by Ada Cruz (Doctor).')
        ->and($notification->toMail($recipient)->introLines[0])->toBe($notification->toDatabase($recipient)['message'])
        ->and((new MedicalReportReleased)->toDatabase($recipient)['message'])->toBe('Your medical report was forwarded to reception for collection preparation.');
});

test('document notifications distinguish approval pickup and actual release with action specific actors', function () {
    $actor = User::factory()->create(['first_name' => 'Maya', 'middle_name' => null, 'last_name' => 'Reyes', 'role' => 'receptionist']);
    $recipient = User::factory()->make();
    $document = new MedicalDocument(['title' => 'Laboratory report', 'document_number' => 'DOC-182', 'status' => 'approved', 'approved_by' => $actor->id]);
    expect((new MedicalDocumentStatusChanged($document))->toArray($recipient)['message'])->toBe('Your Laboratory report (DOC-182) was approved by Maya Reyes (Receptionist) and is being prepared for release.');
    $document->status = 'ready_for_pickup';
    expect((new MedicalDocumentStatusChanged($document))->toArray($recipient)['message'])->toContain('is ready for pickup')->not->toContain('Maya Reyes');
    $document->status = 'released';
    $document->released_by = $actor->id;
    expect((new MedicalDocumentStatusChanged($document))->toArray($recipient)['message'])->toBe('Your Laboratory report (DOC-182) was released by Maya Reyes (Receptionist).');
});

test('appointment notices identify their record without dangling time or missing patient errors', function (string $class, string $title) {
    $appointment = wordingAppointment();
    $appointment->setRelation('company', null);
    $recipient = User::factory()->make(['role' => 'doctor']);
    $notification = $class === OnsiteStaffAssigned::class ? new $class($appointment, 'doctor') : new $class($appointment);
    $data = $notification->toDatabase($recipient);
    expect($data['title'])->toBe($title)
        ->and($data['message'])->toContain('APT0182')->not->toContain(' at .');
})->with([
    [AppointmentAssigned::class, 'Appointment assigned'],
    [AppointmentSubmitted::class, 'Appointment request submitted'],
    [AppointmentReminder::class, 'Appointment reminder'],
    [AppointmentRejected::class, 'Appointment request rejected'],
    [NewAppointmentRequest::class, 'Appointment request received'],
    [OnsiteStaffAssigned::class, 'Onsite event assignment'],
]);

test('schedule expired request rejection is an automatic decision', function () {
    $appointment = wordingAppointment();
    $appointment->rejection_reason = 'schedule_expired';
    $recipient = User::factory()->make();
    expect((new AppointmentRejected($appointment))->toDatabase($recipient)['message'])->toContain('The system rejected your appointment request APT0182');
});

test('doctor schedule notices snapshot requesting doctor and approving administrator separately', function () {
    $doctor = User::factory()->make(['first_name' => 'Ada', 'middle_name' => null, 'last_name' => 'Cruz', 'role' => 'doctor']);
    $admin = User::factory()->create(['first_name' => 'Maya', 'middle_name' => null, 'last_name' => 'Reyes', 'role' => 'admin']);
    $request = new DoctorAvailabilityChangeRequest(['reviewed_by' => $admin->id]);
    $request->id = 42;
    $request->setRelation('doctor', $doctor);
    $requested = new DoctorAvailabilityChangeRequested($request);
    $pending = new DoctorScheduleChangePending($request, wordingAppointment());
    $changed = new DoctorScheduleChanged($request, 2);
    $doctor->first_name = 'Changed';

    expect($requested->toArray($admin)['message'])->toContain('Ada Cruz (Doctor) requested')->not->toContain('Maya Reyes')
        ->and($pending->toArray($admin)['message'])->toContain('Ada Cruz (Doctor)', 'appointment APT0182')->not->toContain('was changed')
        ->and($changed->toArray($admin)['message'])->toContain('Ada Cruz (Doctor)', 'by Maya Reyes (Administrator)');
    $request->setRelation('doctor', null);
    $request->reviewed_by = null;
    expect((new DoctorScheduleChanged($request, 0))->toArray($admin)['message'])->toContain('The schedule for the doctor was changed')->not->toContain('System');
});

test('company referral invitations snapshot their actual creator and tolerate missing company', function () {
    $creator = User::factory()->make(['first_name' => 'Ada', 'middle_name' => null, 'last_name' => 'Cruz', 'role' => 'company']);
    $referral = new CompanyReferral(['first_name' => 'Pat', 'referral_number' => 'REF-182', 'examination_purpose' => 'pre_employment']);
    $referral->setRelation('creator', $creator);
    $referral->setRelation('company', null);
    $notification = new CompanyMedicalReferralInvitation($referral, 'test-only-token');
    $creator->first_name = 'Changed';
    $mail = $notification->toMail($creator);
    expect($mail->viewData['referrer'])->toBe('Ada Cruz (Company Representative)')
        ->and($mail->viewData['companyName'])->toBe('your company');
});

test('inquiry messages identify authenticated senders by role without exposing private text', function () {
    $sender = User::factory()->make(['first_name' => 'Ada', 'middle_name' => null, 'last_name' => 'Cruz', 'role' => 'patient']);
    $inquiry = new Inquiry(['category' => 'general', 'message' => 'Private medical concern']);
    $inquiry->id = 42;
    $inquiry->setRelation('user', $sender);
    $notification = new NewInquirySubmitted($inquiry);
    $sender->first_name = 'Changed';
    expect($notification->toArray($sender)['message'])->toBe('Ada Cruz (Patient) submitted inquiry INQ-000042 (General Inquiry).')->not->toContain('Private medical concern');
});

test('an issuance notice does not credit the document approver when its issuing actor is unknown', function () {
    $approver = User::factory()->create(['first_name' => 'Earlier', 'last_name' => 'Reviewer', 'role' => 'doctor']);
    $document = new MedicalDocument(['title' => 'Medical certificate', 'status' => 'approved', 'approved_by' => $approver->id]);
    $notice = new MedicalDocumentStatusChanged($document, null, 'issued');
    expect($notice->toArray($approver)['message'])->toContain('was issued')->not->toContain('Earlier', 'Reviewer');
});

test('document pickup reversals use the event actor instead of the original ready actor', function () {
    $original = User::factory()->create(['role' => 'admin']);
    $actor = User::factory()->make(['first_name' => 'Maya', 'middle_name' => null, 'last_name' => 'Reyes', 'role' => 'receptionist']);
    $document = new MedicalDocument(['title' => 'Laboratory report', 'status' => 'ready_for_pickup', 'ready_by' => $original->id]);
    $notification = new MedicalDocumentStatusChanged($document, $actor);
    $actor->first_name = 'Changed';
    expect($notification->toArray($actor)['message'])->toContain('is ready for pickup', 'by Maya Reyes (Receptionist)')->not->toContain($original->name);
});
