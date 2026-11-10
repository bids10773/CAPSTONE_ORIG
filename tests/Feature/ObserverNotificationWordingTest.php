<?php

use App\Models\Appointment;
use App\Models\ClinicalFormAudit;
use App\Models\SecurityAudit;
use App\Models\User;

test('license verification names the audit actor and affected professional separately', function () {
    $admin = User::factory()->create(['first_name' => 'Ada', 'last_name' => 'Admin', 'role' => 'admin']);
    $doctor = User::factory()->create(['first_name' => 'Dee', 'last_name' => 'Doctor', 'role' => 'doctor']);
    $other = User::factory()->create(['first_name' => 'Other', 'last_name' => 'Admin', 'role' => 'admin']);
    $this->actingAs($other);

    SecurityAudit::create(['actor_id' => $admin->id, 'target_user_id' => $doctor->id,
        'action' => 'professional_license_verified', 'status' => 'success']);

    expect($doctor->notifications()->first()->data['message'])->toBe('Your professional license was verified by Ada Admin (Administrator).')
        ->and($admin->notifications()->first()->data['message'])->toBe("Dee Doctor's professional license was verified by Ada Admin (Administrator).");
});

test('clinical audit wording preserves the actual action and audit actor', function ($form, $action, $title, $phrase) {
    $admin = User::factory()->create(['role' => 'admin']);
    $actor = User::factory()->create(['first_name' => 'Clara', 'last_name' => 'Clinician', 'role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create(['user_id' => $patient->id, 'type' => 'individual', 'status' => 'accepted', 'appointment_date' => today(), 'service_types' => ['CBC']]);
    ClinicalFormAudit::create(['appointment_id' => $appointment->id, 'actor_id' => $actor->id, 'form_type' => $form, 'action' => $action, 'changes' => ['private' => 'SECRET']]);
    $data = $admin->notifications()->where('data->type', 'clinical_'.$form.'_'.$action)->first()->data;
    expect($data['title'])->toBe($title)
        ->and($data['message'])->toContain($phrase, $appointment->reference_code, 'Clara Clinician (Doctor)')
        ->not->toContain('SECRET', 'completed or updated');
})->with([
    ['physical_exam', 'created', 'Physical examination recorded', 'was recorded'],
    ['physical_exam', 'updated', 'Physical examination updated', 'was updated'],
    ['laboratory', 'updated', 'Laboratory results draft updated', 'draft was updated'],
    ['laboratory', 'finalized', 'Laboratory results finalized', 'were finalized'],
    ['xray', 'procedure_performed', 'X-ray procedure performed', 'was performed'],
    ['xray', 'result_verified', 'X-ray results verified', 'were verified'],
    ['medical_examination', 'report_released', 'Medical report forwarded to reception', 'forwarded to reception for collection preparation'],
]);

test('unknown security actors remain neutral even when another user is authenticated', function () {
    $admin = User::factory()->create(['first_name' => 'Unrelated', 'last_name' => 'Admin', 'role' => 'admin']);
    $doctor = User::factory()->create(['first_name' => 'Dee', 'last_name' => 'Doctor', 'role' => 'doctor']);
    $this->actingAs($admin);
    SecurityAudit::create(['target_user_id' => $doctor->id, 'action' => 'professional_license_verified', 'status' => 'success']);
    expect($doctor->notifications()->first()->data['message'])->toBe('Your professional license was verified.');
});

test('certificate transitions retain separate approval and issuance stages', function ($stage, $title, $verb) {
    $admin = User::factory()->create(['role' => 'admin']);
    $actor = User::factory()->create(['first_name' => 'Clara', 'last_name' => 'Clinician', 'role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $certificate = \App\Models\MedicalCertificate::withoutEvents(fn () => \App\Models\MedicalCertificate::create([
        'certificate_number' => 'MC-2026-999999', 'sequence_year' => 2026, 'sequence_number' => 999999,
        'patient_id' => $patient->id, 'attending_physician_id' => $actor->id, 'created_by' => $admin->id,
        'salutation' => 'Ms.', 'patient_name' => 'SECRET PATIENT', 'consultation_date' => today(),
        'physician_name' => 'Private Physician', 'clinical_impression' => 'SECRET DIAGNOSIS', 'status' => 'draft',
    ]));
    $this->actingAs($actor);
    $certificate->update(['status' => $stage]);
    $data = $admin->notifications()->first()->data;
    expect($data['title'])->toBe($title)
        ->and($data['message'])->toContain('MC-2026-999999', $verb, 'Clara Clinician (Doctor)')
        ->not->toContain('SECRET');
})->with([
    ['pending_approval', 'Medical certificate submitted', 'submitted for physician approval'],
    ['approved', 'Medical certificate approved', 'approved for issuance'],
    ['issued', 'Medical certificate issued', 'was issued'],
    ['void', 'Medical certificate voided', 'was voided'],
]);

test('appointment status wording names the acting receptionist and uses a readable status', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $actor = User::factory()->create(['first_name' => 'Rae', 'last_name' => 'Reception', 'role' => 'receptionist']);
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create(['user_id' => $patient->id, 'type' => 'individual', 'status' => 'accepted', 'appointment_date' => today(), 'service_types' => ['CBC']]);
    $this->actingAs($actor);
    $appointment->update(['status' => 'for_final_evaluation']);
    $message = $admin->notifications()->where('data->type', 'appointment_updated')->first()->data['message'];
    expect($message)->toContain($appointment->reference_code, 'awaiting final evaluation', 'Rae Reception (Receptionist)')->not->toContain('for_final_evaluation');
});

test('automatic queue assignment identifies the system even within an authenticated action', function () {
    $admin = User::factory()->create(['first_name' => 'Ada', 'last_name' => 'Admin', 'role' => 'admin']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $event = Appointment::create(['user_id' => $patient->id, 'type' => 'company_bulk', 'status' => 'accepted', 'appointment_date' => today(), 'service_types' => ['PE']]);
    $visit = Appointment::create(['user_id' => $patient->id, 'bulk_appointment_id' => $event->id, 'type' => 'company_bulk', 'status' => 'arrived', 'appointment_date' => today(), 'service_types' => ['PE']]);
    \App\Models\OnsiteEventStaff::create(['bulk_appointment_id' => $event->id, 'user_id' => $doctor->id, 'service_role' => 'doctor', 'queue_capacity' => 1, 'is_active' => true]);
    \App\Models\OnsiteServiceQueue::create(['bulk_appointment_id' => $event->id, 'appointment_id' => $visit->id, 'service_role' => 'doctor', 'status' => 'waiting']);
    $this->actingAs($admin);
    app(\App\Services\OnsiteEventWorkflowService::class)->assignNext($event->id, 'doctor');
    $message = $doctor->notifications()->where('data->type', 'onsite_task_assigned')->first()->data['message'];
    expect($message)->toContain('by the system', $visit->reference_code)->not->toContain('Ada Admin');
});

test('company account changes identify the company and current action actor', function () {
    $admin = User::factory()->create(['first_name' => 'Ada', 'last_name' => 'Admin', 'role' => 'admin']);
    $this->actingAs($admin);
    $company = \App\Models\Company::create(['company_name' => 'Example Co', 'status' => 'active']);
    expect($admin->notifications()->where('data->type', 'company_account_created')->first()->data['message'])
        ->toBe('The company account for Example Co was registered by Ada Admin (Administrator).');
});

test('availability review identifies the doctor request and reviewer', function () {
    $admin = User::factory()->create(['first_name' => 'Ada', 'last_name' => 'Admin', 'role' => 'admin']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $request = \App\Models\DoctorAvailabilityChangeRequest::create(['doctor_id' => $doctor->id, 'status' => 'pending', 'current_availability' => [], 'requested_availability' => []]);
    $request->update(['status' => 'accepted', 'reviewed_by' => $admin->id]);
    expect($doctor->notifications()->first()->data['message'])->toBe('Your availability change request #'.$request->id.' was accepted by Ada Admin (Administrator).');
});

test('onsite deployment changes never reuse the earlier assigning actor', function () {
    $admin = User::factory()->create(['first_name' => 'Ada', 'last_name' => 'Admin', 'role' => 'admin']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $event = Appointment::create(['user_id' => $doctor->id, 'type' => 'company_bulk', 'status' => 'accepted', 'appointment_date' => today(), 'service_types' => ['PE']]);
    $deployment = \App\Models\OnsiteEventStaff::create(['bulk_appointment_id' => $event->id, 'user_id' => $doctor->id, 'service_role' => 'doctor', 'queue_capacity' => 1, 'is_active' => true, 'assigned_by' => $admin->id]);
    $deployment->update(['is_active' => false]);
    $message = $doctor->notifications()->where('data->type', 'onsite_assignment_removed')->first()->data['message'];
    expect($message)->toContain($event->reference_code, 'removed')->not->toContain('Ada Admin', 'system');
});

test('bulk report audit identifies the event and recorded actor without leaking metadata', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $doctor = User::factory()->create(['first_name' => 'Dee', 'last_name' => 'Doctor', 'role' => 'doctor']);
    $owner = User::factory()->create(['role' => 'company']);
    $event = Appointment::create(['user_id' => $owner->id, 'type' => 'company_bulk', 'status' => 'accepted', 'appointment_date' => today(), 'service_types' => ['PE']]);
    SecurityAudit::create(['actor_id' => $doctor->id, 'action' => 'bulk_medical_report_generated', 'status' => 'success', 'metadata' => ['bulk_appointment_id' => $event->id, 'private' => 'SECRET']]);
    $message = $admin->notifications()->where('data->type', 'bulk_medical_report_generated')->first()->data['message'];
    expect($message)->toContain($event->reference_code, 'generated', 'Dee Doctor (Doctor)')->not->toContain('SECRET');
});

test('document audit distinguishes review readiness release and reversal without private release details', function ($action, $title, $phrase) {
    $admin = User::factory()->create(['role' => 'admin']);
    $actor = User::factory()->create(['first_name' => 'Rae', 'last_name' => 'Reception', 'role' => 'receptionist']);
    $patient = User::factory()->create(['role' => 'patient']);
    $document = \App\Models\MedicalDocument::create([
        'document_number' => 'DOC-TEST', 'source_key' => 'test:1', 'source_type' => 'test', 'source_id' => 1,
        'patient_id' => $patient->id, 'document_type' => 'laboratory_report', 'title' => 'SECRET TITLE', 'status' => 'pending',
    ]);
    \App\Models\MedicalDocumentAudit::create(['medical_document_id' => $document->id, 'actor_id' => $actor->id, 'action' => $action,
        'metadata' => ['representative_name' => 'SECRET REPRESENTATIVE', 'reason' => 'SECRET REASON']]);
    $data = $admin->notifications()->where('data->type', 'medical_document_'.$action)->first()->data;
    expect($data['title'])->toBe($title)->and($data['message'])->toContain('DOC-TEST', $phrase, 'Rae Reception (Receptionist)')->not->toContain('SECRET');
})->with([
    ['reviewed', 'Medical document reviewed', 'reviewed for release'],
    ['marked_ready', 'Medical document ready for pickup', 'ready for pickup'],
    ['released', 'Medical document released', 'release was recorded'],
    ['release_reversed', 'Medical document release reversed', 'release was reversed'],
]);

test('later referral status changes do not identify the referral creator as their actor', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = \App\Models\Company::create(['company_name' => 'Example Co', 'status' => 'active']);
    $account = User::factory()->create(['first_name' => 'Original', 'last_name' => 'Creator', 'role' => 'company', 'company_id' => $company->id]);
    $referral = \App\Models\CompanyReferral::create(['company_id' => $company->id, 'created_by' => $account->id,
        'referral_number' => 'REF-WORDING', 'invitation_token_hash' => hash('sha256', 'SECRET'), 'employee_email' => 'private@example.com',
        'first_name' => 'Private', 'last_name' => 'Patient', 'required_services' => ['CBC'], 'examination_purpose' => 'medical_clearance', 'valid_until' => today()->addDay(), 'status' => 'sent']);
    $admin->notifications()->delete();
    $referral->update(['status' => 'cancelled']);
    $message = $admin->notifications()->where('data->type', 'company_referral_updated')->first()->data['message'];
    expect($message)->toContain('REF-WORDING', 'Example Co', 'cancelled')->not->toContain('Original Creator', 'system', 'SECRET', 'private@example.com');
});

test('automatic scheduling cleanup never attributes rejection cancellation or replacement to the authenticated user', function ($role) {
    $admin = User::factory()->create(['role' => 'admin']);
    $unrelated = User::factory()->create(['first_name' => 'Unrelated', 'last_name' => 'Visitor', 'role' => $role]);
    $patient = User::factory()->create(['role' => 'patient']);
    $walkInPatient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $oldDoctor = User::factory()->create(['role' => 'doctor']);
    $base = ['user_id' => $patient->id, 'doctor_id' => $doctor->id, 'type' => 'individual', 'appointment_date' => today(), 'start_time' => '09:00', 'end_time' => '09:30', 'service_types' => ['CBC']];
    $pending = Appointment::create([...$base, 'status' => 'pending']);
    $confirmed = Appointment::create([...$base, 'status' => 'accepted']);
    $walkIn = Appointment::create(['user_id' => $walkInPatient->id, 'doctor_id' => $oldDoctor->id, 'type' => 'walk_in', 'appointment_date' => today(), 'status' => 'arrived', 'arrived_at' => today()->setTime(8, 50), 'service_types' => ['CBC']]);
    foreach ([$admin, $doctor, $oldDoctor, $walkInPatient] as $recipient) {
        $recipient->notifications()->delete();
    }
    $this->actingAs($unrelated);
    expect(app(\App\Services\AppointmentSchedulingService::class)->expireLateAppointments(today()->setTime(10, 0)))->toBe(2);
    expect($admin->notifications()->where('data->type', 'appointment_updated')->count())->toBe(3)
        ->and($pending->fresh()->status)->toBe('rejected')
        ->and($confirmed->fresh()->status)->toBe('cancelled')
        ->and($walkIn->fresh()->released_from_appointment_id)->toBe($confirmed->id);
    foreach ([$admin, $doctor, $oldDoctor, $walkInPatient] as $recipient) {
        $messages = $recipient->notifications()->whereIn('data->type', ['appointment_updated', 'appointment_status_changed', 'appointment_assignment_changed', 'appointment_assignment_removed', 'appointment_schedule_changed'])->get()->pluck('data.message');
        expect($messages)->not->toBeEmpty();
        foreach ($messages as $message) {
            expect($message)->toContain('by the system')->not->toContain('Unrelated Visitor');
        }
    }
})->with(['patient', 'admin']);

test('automatic bulk request rejection uses the system in company notifications', function () {
    $company = \App\Models\Company::create(['company_name' => 'Example Co', 'status' => 'active']);
    $account = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $unrelated = User::factory()->create(['first_name' => 'Unrelated', 'last_name' => 'Visitor', 'role' => 'admin']);
    $event = Appointment::create(['user_id' => $account->id, 'company_id' => $company->id, 'type' => 'company_bulk', 'status' => 'pending', 'appointment_date' => today(), 'start_time' => '09:00', 'end_time' => '09:30', 'service_types' => ['CBC']]);
    $this->actingAs($unrelated);
    app(\App\Services\AppointmentSchedulingService::class)->expireLateAppointments(today()->setTime(10, 0));
    $message = $account->notifications()->where('data->type', 'company_event_updated')->first()->data['message'];
    expect($event->fresh()->status)->toBe('rejected')->and($message)->toContain('by the system', 'rejected')->not->toContain('Unrelated Visitor');
});

test('license profile changes attach the actor to the action before the proof requirement', function () {
    $admin = User::factory()->create(['first_name' => 'Ada', 'last_name' => 'Admin', 'role' => 'admin']);
    $doctor = User::factory()->create(['first_name' => 'Dee', 'last_name' => 'Doctor', 'role' => 'doctor']);
    SecurityAudit::create(['actor_id' => $admin->id, 'target_user_id' => $doctor->id, 'action' => 'professional_license_changed', 'status' => 'success']);
    expect($admin->notifications()->first()->data['message'])->toBe("Dee Doctor's professional license profile was changed by Ada Admin (Administrator). New proof is required.");
});

test('automatic referral expiry and appointment cancellation identify the system instead of the viewer', function ($boundary) {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = \App\Models\Company::create(['company_name' => 'Example Co', 'status' => 'active']);
    $account = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $patient = User::factory()->create(['role' => 'patient']);
    $unrelated = User::factory()->create(['first_name' => 'Unrelated', 'last_name' => 'Visitor', 'role' => 'admin']);
    $referral = \App\Models\CompanyReferral::create(['company_id' => $company->id, 'patient_id' => $patient->id, 'created_by' => $account->id,
        'referral_number' => 'REF-AUTO', 'invitation_token_hash' => hash('sha256', 'auto-token'), 'employee_email' => $patient->email,
        'first_name' => 'Private', 'last_name' => 'Patient', 'required_services' => ['CBC'], 'examination_purpose' => 'medical_clearance', 'valid_until' => today()->subDay(), 'status' => 'sent']);
    if ($boundary === 'appointment cancellation') {
        Appointment::create(['user_id' => $patient->id, 'company_referral_id' => $referral->id, 'type' => 'company_referral', 'status' => 'accepted', 'appointment_date' => today(), 'start_time' => '09:00', 'end_time' => '09:30', 'service_types' => ['CBC']]);
    }
    $admin->notifications()->delete();
    $this->actingAs($unrelated);
    if ($boundary === 'invitation expiry') {
        $request = \Illuminate\Http\Request::create('/company-referrals/invitation/auto-token');
        app(\App\Http\Controllers\CompanyReferralController::class)->invitation($request, 'auto-token');
    } else {
        app(\App\Services\AppointmentSchedulingService::class)->expireLateAppointments(today()->setTime(10, 0));
    }
    $message = $admin->notifications()->where('data->type', 'company_referral_updated')->first()->data['message'];
    expect($referral->fresh()->status)->toBe($boundary === 'invitation expiry' ? 'expired' : 'cancelled')
        ->and($message)->toContain('by the system')->not->toContain('Unrelated Visitor');
})->with(['invitation expiry', 'appointment cancellation']);

test('referral invitation delivery failure identifies the automatic pending transition', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = \App\Models\Company::create(['company_name' => 'Example Co', 'status' => 'active']);
    $account = User::factory()->create(['first_name' => 'Company', 'last_name' => 'Creator', 'role' => 'company', 'company_id' => $company->id]);
    $this->actingAs($account);
    $mailer = Mockery::mock(\Illuminate\Contracts\Mail\Mailer::class);
    $mailer->shouldReceive('send')->once()->andThrow(new RuntimeException('Mail delivery failed'));
    $factory = Mockery::mock(\Illuminate\Contracts\Mail\Factory::class);
    $factory->shouldReceive('mailer')->once()->andReturn($mailer);
    $this->app->instance(\Illuminate\Contracts\Mail\Factory::class, $factory);
    $referral = app(\App\Services\CompanyReferralService::class)->create($account, ['first_name' => 'Private', 'last_name' => 'Patient', 'email' => 'private@example.com', 'examination_purpose' => 'medical_clearance', 'service_types' => ['CBC']]);
    $messages = $admin->notifications()->where('data->type', 'company_referral_updated')->get()->pluck('data.message');
    expect($referral->status)->toBe('pending')->and($messages)->toHaveCount(2);
    $message = $messages->first(fn ($message) => str_contains($message, 'awaiting invitation delivery'));
    expect($message)->not->toBeNull()->toContain('by the system')->not->toContain('Company Creator');
});
