<?php

use App\Models\Appointment;
use App\Models\PhysicalExam;
use App\Models\User;
use App\Models\XrayReport;
use App\Services\MedicalExaminationService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function delayedPeAppointment(array $services = ['PE', 'Drug Test']): Appointment
{
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->create(['role' => 'doctor']);

    return Appointment::create([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'for_diagnostics',
        'service_types' => $services,
    ]);
}

test('PE master creates unique diagnostic children linked by foreign keys', function () {
    $appointment = delayedPeAppointment();
    $examination = app(MedicalExaminationService::class)->forAppointment($appointment);

    expect($examination->appointment_id)->toBe($appointment->id)
        ->and($examination->diagnosticResults()->pluck('service_key')->all())
        ->toContain('cbc', 'urinalysis', 'fecalysis', 'serology', 'drug_test');

    $this->assertDatabaseCount('medical_examinations', 1);
    $this->assertDatabaseHas('diagnostic_results', [
        'medical_examination_id' => $examination->id,
        'appointment_id' => $appointment->id,
        'patient_id' => $appointment->user_id,
        'service_key' => 'drug_test',
    ]);
});

test('pending official drug test prevents readiness for multiple days independently of visit status', function () {
    $appointment = delayedPeAppointment();
    $examination = app(MedicalExaminationService::class)->forAppointment($appointment);
    $examination->diagnosticResults()->where('service_key', 'drug_test')->update([
        'status' => 'awaiting_official_result',
        'performed_at' => now()->subDays(3),
    ]);
    $appointment->update(['status' => 'completed']);

    expect($examination->fresh()->isReadyForFinalEvaluation())->toBeFalse()
        ->and($appointment->fresh()->status)->toBe('completed')
        ->and($examination->fresh()->diagnosticResults()->where('service_key', 'drug_test')->value('status'))
        ->toBe('awaiting_official_result');
});

test('assigned doctor verifies an official drug test while unauthorized clinical staff cannot', function () {
    Storage::fake('local');
    $appointment = delayedPeAppointment();
    $examination = app(MedicalExaminationService::class)->forAppointment($appointment);
    $examination->diagnosticResults()->where('service_key', 'drug_test')->update(['status' => 'awaiting_official_result']);
    $payload = [
        'result' => 'negative',
        'official_result_date' => today()->toDateString(),
        'official_reference_number' => 'DT-1001',
        'supporting_document' => UploadedFile::fake()->create('official.pdf', 100, 'application/pdf'),
    ];

    $medtech = User::factory()->create(['role' => 'medtech']);
    $this->actingAs($medtech)->post(route('doctor.diagnostics.drug-test.verify', $appointment), $payload)->assertForbidden();
    $this->actingAs($appointment->doctor)->post(route('doctor.diagnostics.drug-test.verify', $appointment), $payload)
        ->assertSessionHas('success');

    $result = $examination->diagnosticResults()->where('service_key', 'drug_test')->firstOrFail();
    expect($result->status)->toBe('verified')
        ->and($result->result_data['final_result']['summary'])->toBe('negative')
        ->and($result->verified_by)->toBe($appointment->doctor_id)
        ->and($result->supporting_document_path)->not->toBeNull();
});

test('xray procedure alone is not a verified final result', function () {
    $appointment = delayedPeAppointment(['PE']);
    $examination = app(MedicalExaminationService::class)->forAppointment($appointment);
    XrayReport::create([
        'appointment_id' => $appointment->id,
        'medical_examination_id' => $examination->id,
        'radiologist_id' => User::factory()->create(['role' => 'radtech'])->id,
        'status' => 'awaiting_result',
        'performed_at' => now(),
        'is_completed' => false,
    ]);

    expect($appointment->fresh()->xrayReport->isVerified())->toBeFalse()
        ->and($examination->fresh()->isReadyForFinalEvaluation())->toBeFalse();
});

test('combined verification status recalculates as each result is verified', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'for_diagnostics',
        'service_types' => ['Drug Test', 'X-Ray'],
    ]);
    $examination = app(MedicalExaminationService::class)->forAppointment($appointment);
    $drug = $examination->diagnosticResults()->where('service_key', 'drug_test')->firstOrFail();
    $drug->update(['status' => 'verifying', 'performed_at' => now()]);
    $xray = XrayReport::create([
        'appointment_id' => $appointment->id,
        'medical_examination_id' => $examination->id,
        'radiologist_id' => User::factory()->create(['role' => 'radtech'])->id,
        'status' => 'verifying',
        'performed_at' => now(),
        'is_completed' => false,
    ]);

    $resolver = app(\App\Services\EmployeeMedicalStatusResolver::class);
    expect($resolver->resolve($appointment->fresh()))->toBe('verifying_drug_and_xray');

    $xray->update(['status' => 'completed', 'is_completed' => true, 'verified_by' => $xray->radiologist_id, 'verified_at' => now()]);
    expect($resolver->resolve($appointment->fresh()))->toBe('verifying_drug_test');

    $drug->update(['status' => 'verified', 'verified_by' => User::factory()->create(['role' => 'doctor'])->id, 'verified_at' => now()]);
    expect($resolver->resolve($appointment->fresh()))->toBe('for_final_evaluation')
        ->and($appointment->fresh()->status)->toBe('for_final_evaluation');
});

test('patient cannot download PE records until finalized report is explicitly released', function () {
    Notification::fake();
    $appointment = delayedPeAppointment(['PE']);
    $examination = app(MedicalExaminationService::class)->forAppointment($appointment);
    PhysicalExam::create([
        'appointment_id' => $appointment->id,
        'medical_examination_id' => $examination->id,
        'doctor_id' => $appointment->doctor_id,
        'classification' => 'Pending',
        'is_completed' => true,
    ]);
    $examination->update([
        'status' => 'finalized',
        'medical_classification' => 'Class A',
        'fit_to_work' => true,
        'finalized_by' => $appointment->doctor_id,
        'finalized_at' => now(),
    ]);

    $this->actingAs($appointment->user)
        ->get(route('clinical-forms.physical-exam.pdf', $appointment))
        ->assertForbidden();

    $this->actingAs($appointment->doctor)
        ->post(route('doctor.medical-reports.release', $appointment))
        ->assertSessionHas('success');

    expect($examination->fresh())
        ->status->toBe('report_released')
        ->released_at->not->toBeNull()
        ->released_by->toBe($appointment->doctor_id);

    $this->actingAs($appointment->user)
        ->get(route('clinical-forms.physical-exam.pdf', $appointment))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

test('finalized unreleased PE remains visible in the assigned doctor release queue', function () {
    $appointment = delayedPeAppointment(['PE']);
    $appointment->update(['status' => 'completed']);
    $examination = app(MedicalExaminationService::class)->forAppointment($appointment);
    $examination->update([
        'status' => 'finalized',
        'finalized_by' => $appointment->doctor_id,
        'finalized_at' => now(),
    ]);

    $this->actingAs($appointment->doctor)
        ->get(route('doctor.appointments'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('doctor/appointments/index')
            ->has('appointments.data', 1)
            ->where('appointments.data.0.id', $appointment->id)
            ->where('appointments.data.0.medical_examination.released_at', null));

    $examination->update(['released_by' => $appointment->doctor_id, 'released_at' => now(), 'status' => 'report_released']);

    $this->actingAs($appointment->doctor)
        ->get(route('doctor.appointments'))
        ->assertInertia(fn (Assert $page) => $page->has('appointments.data', 0));
});

test('updated PE PDF uses the official consolidated medical examination sections', function () {
    $appointment = delayedPeAppointment(['PE']);
    $examination = app(MedicalExaminationService::class)->forAppointment($appointment);
    $physical = PhysicalExam::create([
        'appointment_id' => $appointment->id,
        'medical_examination_id' => $examination->id,
        'doctor_id' => $appointment->doctor_id,
        'classification' => 'Pending',
        'height' => 162,
        'weight' => 58.3,
        'blood_pressure' => '110/80',
        'pulse_rate' => 75,
        'respiration_rate' => 16,
        'temperature' => 36.7,
        'visual_acuity' => 'OU 20/20',
        'hearing' => 'Normal',
        'is_completed' => true,
    ]);
    $appointment->load([
        'user.patientProfile', 'company', 'medicalHistory', 'labResult',
        'xrayReport.verifiedBy', 'medicalExamination.examiningDoctor',
        'medicalExamination.finalizedBy', 'medicalExamination.diagnosticResults',
    ]);

    $html = view('pdf.physical-examination-report', [
        'appointment' => $appointment,
        'examination' => $appointment->medicalExamination,
        'physical' => $physical->load('doctor'),
        'history' => $appointment->medicalHistory,
        'laboratory' => $appointment->labResult,
        'xray' => $appointment->xrayReport,
    ])->render();

    expect($html)
        ->toContain('Medical Examination Report')
        ->toContain('I. MEDICAL HISTORY')
        ->toContain('II. PHYSICAL EXAMINATION')
        ->toContain('III. LABORATORY')
        ->toContain('IV. CHEST X-RAY')
        ->toContain('CLASS A')
        ->toContain('CERTIFICATION')
        ->toContain('110/80')
        ->toContain('OU 20/20');
});
