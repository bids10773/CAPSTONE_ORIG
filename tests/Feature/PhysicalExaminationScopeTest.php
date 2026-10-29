<?php

use App\Models\Appointment;
use App\Models\MedicalDocument;
use App\Models\User;
use App\Services\MedicalDocumentService;

test('PE denotes a physical examination and only explicit package purposes denote complete examinations', function (?string $purpose, bool $package) {
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create([
        'user_id' => $patient->id, 'type' => 'individual', 'status' => 'pending',
        'appointment_date' => today(), 'service_types' => ['PE'], 'examination_purpose' => $purpose,
    ]);
    expect($appointment->isPePackage())->toBe($package)
        ->and($appointment->medicalExamination)->not->toBeNull();
})->with([[null, false], ['medical_clearance', false], ['pre_employment', true], ['annual_pe', true]]);

test('a standalone physical examination creates separate reports only for selected services', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create([
        'user_id' => $patient->id, 'type' => 'individual', 'status' => 'pending',
        'appointment_date' => today(), 'service_types' => ['PE', 'CBC'],
    ]);
    app(MedicalDocumentService::class)->synchronizeAppointment($appointment);
    expect($appointment->medicalDocuments()->orderBy('id')->pluck('title')->all())
        ->toBe(['Physical Examination Report', 'Laboratory Report']);
    expect(MedicalDocument::query()->releaseVisible()->count())->toBe(2);
});

test('consultation requests do not register full examination reports and hide earlier incorrectly registered reports', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create([
        'user_id' => $patient->id, 'type' => 'individual', 'status' => 'pending',
        'appointment_date' => today(), 'service_types' => ['PE', 'CBC', 'X-Ray'],
        'examination_purpose' => 'medical_clearance',
    ]);
    $legacy = MedicalDocument::create([
        'document_number' => 'DOC-LEGACY-CONSULTATION', 'source_key' => "appointment:{$appointment->id}:physical_examination",
        'source_type' => 'appointment', 'source_id' => $appointment->id, 'patient_id' => $patient->id,
        'appointment_id' => $appointment->id, 'document_type' => 'physical_examination',
        'title' => 'Complete Medical Examination Report', 'status' => 'approved', 'requested_at' => now(),
    ]);
    app(MedicalDocumentService::class)->synchronizeAppointment($appointment);
    expect(MedicalDocument::query()->releaseVisible()->pluck('title')->all())
        ->toBe(['Laboratory Report', 'Chest X-Ray Report']);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    expect($receptionist->can('release', $legacy))->toBeFalse();
});

test('standalone physical examination PDF contains examination findings without package sections', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $appointment = Appointment::create([
        'user_id' => $patient->id, 'doctor_id' => $doctor->id, 'type' => 'individual',
        'status' => 'arrived', 'appointment_date' => today(), 'service_types' => ['PE'],
    ]);
    $physical = $appointment->physicalExam()->create([
        'medical_examination_id' => $appointment->medicalExamination->id,
        'doctor_id' => $doctor->id, 'classification' => 'Pending', 'is_completed' => true, 'remarks' => 'Physical assessment recorded.',
    ]);
    $html = view('pdf.physical-examination', ['appointment' => $appointment, 'physical' => $physical, 'history' => null])->render();
    expect($html)->toContain('PHYSICAL EXAMINATION REPORT', 'Physical assessment recorded.')
        ->not->toContain('III. LABORATORY', 'IV. CHEST X-RAY', 'ECG', 'CLASS A', 'Classifying Physician');
});
