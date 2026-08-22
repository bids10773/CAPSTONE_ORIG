<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use App\Services\BulkAppointmentEnrollmentService;
use App\Services\CompanyBulkMedicalReportService;
use App\Services\MedicalExaminationService;

test('bulk report preview follows selected services and labels unverified results as pending', function () {
    $company = Company::create(['company_name' => 'Report Workflow Co']);
    $representative = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $event = Appointment::create([
        'user_id' => $representative->id,
        'company_id' => $company->id,
        'appointment_date' => today(),
        'type' => 'company_bulk',
        'status' => 'accepted',
        'service_types' => ['Drug Test', 'X-Ray'],
        'service_location' => 'onsite',
    ]);
    $employee = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);
    $child = app(BulkAppointmentEnrollmentService::class)->enroll($event, $employee);
    $examination = app(MedicalExaminationService::class)->forAppointment($child);
    $examination->diagnosticResults()->where('service_key', 'drug_test')->update([
        'status' => 'verifying',
        'result_data' => ['initial_result' => ['methamphetamine' => 'Positive']],
    ]);
    $child->xrayReport()->create([
        'medical_examination_id' => $examination->id,
        'radiologist_id' => User::factory()->create(['role' => 'radtech'])->id,
        'status' => 'awaiting_result',
        'performed_at' => now(),
        'is_completed' => false,
    ]);

    $preview = app(CompanyBulkMedicalReportService::class)->preview($event);
    $keys = collect($preview['columns'])->pluck('key');

    expect($keys)->toContain('drug_test', 'xray')
        ->and($keys)->not->toContain('ecg', 'cbc')
        ->and($preview['rows'][0]['drug_test'])->toStartWith('PENDING')
        ->and($preview['rows'][0]['xray'])->toStartWith('PENDING');
});
