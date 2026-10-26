<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use App\Services\BulkAppointmentEnrollmentService;
use App\Services\CompanyBulkMedicalReportService;
use App\Services\MedicalExaminationService;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;

test('generated bulk reports keep formula-like clinical and identity text literal', function () {
    Storage::fake('local');
    $company = Company::create(['company_name' => '=1+1']);
    $representative = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $admin = User::factory()->create(['role' => 'admin']);
    $event = Appointment::create([
        'user_id' => $representative->id, 'company_id' => $company->id,
        'appointment_date' => today(), 'type' => 'company_bulk', 'status' => 'accepted',
        'service_types' => ['CBC'], 'service_location' => 'onsite',
    ]);
    $employee = User::factory()->create([
        'role' => 'patient', 'company_id' => $company->id,
        'first_name' => '=1+1', 'middle_name' => '@SUM(1,1)', 'last_name' => '+1+1',
    ]);
    $employee->patientProfile()->create(['employee_number' => '000123']);
    $child = app(BulkAppointmentEnrollmentService::class)->enroll($event, $employee);
    $exam = app(MedicalExaminationService::class)->forAppointment($child);
    $exam->update(['finalized_at' => now(), 'medical_classification' => 'Class A', 'final_remarks' => '=2+2']);
    $exam->diagnosticResults()->where('service_key', 'cbc')->update([
        'status' => 'verified', 'verified_at' => now(), 'findings' => '=3+3',
    ]);
    $child->update(['status' => 'completed']);

    $report = app(CompanyBulkMedicalReportService::class)->generate($event, $admin);
    $path = Storage::disk('local')->path($report->file_path);
    $book = IOFactory::load($path);
    try {
        $sheet = $book->getActiveSheet();
        foreach (['A2' => '=1+1', 'B8' => '000123', 'C8' => '+1+1', 'D8' => '=1+1', 'E8' => '@SUM(1,1)', 'F8' => '=3+3', 'H8' => '=2+2'] as $cell => $text) {
            expect($sheet->getCell($cell)->getDataType())->toBe(DataType::TYPE_STRING)
                ->and($sheet->getCell($cell)->getValue())->toBe($text);
        }
        expect($sheet->getCell('A8')->getDataType())->toBe(DataType::TYPE_NUMERIC)
            ->and($sheet->getCell('A8')->getValue())->toBe(1);
        $zip = new ZipArchive;
        expect($zip->open($path))->toBeTrue();
        try {
            expect($zip->getFromName('xl/worksheets/sheet1.xml'))->not->toContain('<f>');
        } finally {
            $zip->close();
        }
    } finally {
        $book->disconnectWorksheets();
    }
});

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
