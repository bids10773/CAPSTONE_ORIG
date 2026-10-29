<?php

use App\Models\Appointment;
use App\Models\ClinicalFormAudit;
use App\Models\MedicalCertificate;
use App\Models\MedicalDocumentAudit;
use App\Models\SecurityAudit;
use App\Models\User;
use App\Observers\ClinicalActivityNotificationObserver;
use App\Observers\MedicalCertificateNotificationObserver;
use App\Observers\MedicalDocumentActivityNotificationObserver;
use App\Observers\StaffSecurityNotificationObserver;
use App\Services\WorkflowNotificationService;

test('license audit notifications use safe messages and notify the affected professional', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $service = Mockery::mock(WorkflowNotificationService::class);
    $service->shouldReceive('admins')->once()->with('professional_license_rejected', 'Professional license update', 'A professional license submission was rejected.', '/admin/staff/'.$doctor->id.'/edit');
    $service->shouldReceive('users')->once()->withArgs(fn ($users, $type, $title, $message, $url) => collect($users)->contains($doctor->id) && $type === 'professional_license_rejected'
        && ! str_contains($message, 'SECRET') && $url === '/settings/profile');
    $this->app->instance(WorkflowNotificationService::class, $service);

    $audit = new SecurityAudit(['target_user_id' => $doctor->id, 'action' => 'professional_license_rejected', 'status' => 'success', 'metadata' => ['reason' => 'SECRET']]);
    (new StaffSecurityNotificationObserver)->created($audit);
});

test('failed security audits do not announce successful workflow changes', function () {
    $service = Mockery::mock(WorkflowNotificationService::class);
    $service->shouldNotReceive('admins');
    $service->shouldNotReceive('users');
    $this->app->instance(WorkflowNotificationService::class, $service);
    (new StaffSecurityNotificationObserver)->created(new SecurityAudit(['action' => 'professional_license_submitted', 'status' => 'failure']));
});

test('document synchronization and clinical downloads never generate operational alerts', function () {
    $service = Mockery::mock(WorkflowNotificationService::class);
    $service->shouldNotReceive('admins');
    $service->shouldNotReceive('users');
    $this->app->instance(WorkflowNotificationService::class, $service);
    (new MedicalDocumentActivityNotificationObserver)->created(new MedicalDocumentAudit(['action' => 'status_synchronized']));
    (new MedicalDocumentActivityNotificationObserver)->created(new MedicalDocumentAudit(['action' => 'registered']));
    (new ClinicalActivityNotificationObserver)->created(new ClinicalFormAudit(['form_type' => 'laboratory', 'action' => 'downloaded']));
});

test('document release operational messages omit representative and reversal details', function () {
    $service = Mockery::mock(WorkflowNotificationService::class);
    $service->shouldReceive('admins')->once()->with('medical_document_release_reversed', 'Medical document update', 'A medical document release was reversed.', '/medical-documents');
    $service->shouldNotReceive('users');
    $this->app->instance(WorkflowNotificationService::class, $service);
    (new MedicalDocumentActivityNotificationObserver)->created(new MedicalDocumentAudit(['action' => 'release_reversed', 'metadata' => ['reason' => 'SECRET']]));
});

test('certificate unchanged saves do not send repeat lifecycle alerts', function () {
    $service = Mockery::mock(WorkflowNotificationService::class);
    $service->shouldNotReceive('admins');
    $service->shouldNotReceive('users');
    $this->app->instance(WorkflowNotificationService::class, $service);
    (new MedicalCertificateNotificationObserver)->updated(new MedicalCertificate(['status' => 'approved']));
});

test('clinical handoffs go only to assigned professionals and omit medical findings', function () {
    $actor = User::factory()->create(['role' => 'medtech']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $unassigned = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create(['user_id' => $patient->id, 'doctor_id' => $doctor->id, 'appointment_date' => now()->addDay(), 'type' => 'individual', 'status' => 'for_final_evaluation', 'service_types' => ['CBC']]);
    $service = Mockery::mock(WorkflowNotificationService::class);
    $service->shouldReceive('admins')->once()->with('clinical_laboratory_finalized', 'Clinical workflow update', 'A clinical workflow step was completed or updated.', '/admin/appointments/'.$appointment->id);
    $service->shouldReceive('users')->once()->withArgs(fn ($users, $type, $title, $message, $url) => collect($users)->pluck('id')->all() === [$doctor->id] && ! str_contains($message, 'SECRET') && $url === '/doctor/appointments');
    $this->app->instance(WorkflowNotificationService::class, $service);
    (new ClinicalActivityNotificationObserver)->created(new ClinicalFormAudit(['appointment_id' => $appointment->id, 'actor_id' => $actor->id, 'form_type' => 'laboratory', 'action' => 'finalized', 'changes' => ['results' => 'SECRET']]));
});

test('registered license observer notifies admins and the professional once without private proof data', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $other = User::factory()->create(['role' => 'patient']);
    SecurityAudit::create(['actor_id' => $admin->id, 'target_user_id' => $doctor->id, 'action' => 'professional_license_rejected', 'status' => 'success', 'metadata' => ['reason' => 'SECRET medical detail', 'license_no' => 'PRIVATE-LICENSE']]);
    expect($admin->notifications()->count())->toBe(1)
        ->and($doctor->notifications()->count())->toBe(1)
        ->and($other->notifications()->count())->toBe(0)
        ->and(json_encode($admin->notifications()->first()->data))->not->toContain('SECRET', 'PRIVATE-LICENSE')
        ->and($doctor->notifications()->first()->data['recipient_role'])->toBe('doctor');
});

test('certificate approval routes operational alerts to receptionists without duplicating patient alerts', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $patient = User::factory()->create(['role' => 'patient']);
    $this->actingAs($doctor);
    $certificate = MedicalCertificate::create([
        'certificate_number' => 'MC-2026-000001', 'sequence_year' => 2026, 'sequence_number' => 1,
        'patient_id' => $patient->id, 'attending_physician_id' => $doctor->id, 'created_by' => $doctor->id,
        'salutation' => 'Ms.', 'patient_name' => 'Private Patient', 'consultation_date' => now()->toDateString(),
        'physician_name' => 'Private Physician', 'clinical_impression' => 'SECRET DIAGNOSIS', 'status' => 'pending_approval',
    ]);
    $admin->notifications()->delete();
    $certificate->update(['status' => 'approved', 'approval_notes' => 'SECRET NOTES']);
    expect($admin->notifications()->count())->toBe(1)
        ->and($receptionist->notifications()->count())->toBe(1)
        ->and($doctor->notifications()->count())->toBe(0)
        ->and($patient->notifications()->count())->toBe(0)
        ->and(json_encode($receptionist->notifications()->first()->data))->not->toContain('SECRET', 'Private Patient');
    $certificate->save();
    expect($admin->notifications()->count())->toBe(1)->and($receptionist->notifications()->count())->toBe(1);
});

test('vital recordings alert the assigned physician and rechecks alert reception without medical details', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $unassigned = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create(['user_id' => $patient->id, 'doctor_id' => $doctor->id, 'appointment_date' => now()->addDay(), 'type' => 'individual', 'status' => 'accepted', 'service_types' => ['PE']]);
    ClinicalFormAudit::create(['appointment_id' => $appointment->id, 'actor_id' => $receptionist->id, 'form_type' => 'vital_signs', 'action' => 'recorded', 'changes' => ['systolic_pressure' => 'SECRET']]);
    expect($doctor->notifications()->count())->toBe(1)->and($unassigned->notifications()->count())->toBe(0);
    ClinicalFormAudit::create(['appointment_id' => $appointment->id, 'actor_id' => $doctor->id, 'form_type' => 'vital_signs', 'action' => 'recheck_requested', 'changes' => ['reason' => 'SECRET reason']]);
    expect($receptionist->notifications()->count())->toBe(1)
        ->and($receptionist->notifications()->first()->data['url'])->toBe('/receptionist/queue')
        ->and(json_encode($receptionist->notifications()->first()->data))->not->toContain('SECRET');
});

test('certificate recipients require current viewing permission and administrators receive one alert', function (string $creatorRole) {
    $creator = User::factory()->create(['role' => 'doctor']);
    $formerPhysician = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $certificate = MedicalCertificate::withoutEvents(fn () => MedicalCertificate::create([
        'certificate_number' => 'MC-2026-000001', 'sequence_year' => 2026, 'sequence_number' => 1,
        'patient_id' => $patient->id, 'attending_physician_id' => $formerPhysician->id, 'created_by' => $creator->id,
        'salutation' => 'Ms.', 'patient_name' => 'Private Patient', 'consultation_date' => now()->toDateString(),
        'physician_name' => 'Former Physician', 'status' => 'pending_approval',
    ]));
    $creator->updateQuietly(['role' => $creatorRole]);
    $formerPhysician->updateQuietly(['role' => 'company']);
    $certificate->update(['status' => 'approved']);
    expect($formerPhysician->notifications()->count())->toBe(0)
        ->and($creator->notifications()->count())->toBe($creatorRole === 'admin' ? 1 : 0);
})->with(['doctor', 'company', 'patient', 'admin']);

test('staff security notices do not follow accounts into non staff roles', function (string $role) {
    $target = User::factory()->create(['role' => $role]);
    $service = Mockery::mock(WorkflowNotificationService::class);
    $service->shouldReceive('admins')->once();
    $service->shouldNotReceive('users');
    $this->app->instance(WorkflowNotificationService::class, $service);
    (new StaffSecurityNotificationObserver)->created(new SecurityAudit([
        'target_user_id' => $target->id, 'action' => 'professional_license_verified', 'status' => 'success',
    ]));
})->with(['patient', 'company', 'admin']);
