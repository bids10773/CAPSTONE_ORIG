<?php

use App\Models\Appointment;
use App\Models\BulkMedicalReport;
use App\Models\Company;
use App\Models\User;
use App\Services\ReportVerificationService;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

function verifiableReportAppointment(array $services = ['CBC']): Appointment
{
    $patient = User::factory()->create(['role' => 'patient', 'first_name' => 'Private', 'last_name' => 'Patient']);
    $doctor = User::factory()->licensed()->create(['role' => 'doctor']);

    return Appointment::create(['user_id' => $patient->id, 'doctor_id' => $doctor->id, 'appointment_date' => today(),
        'type' => 'individual', 'status' => 'completed', 'service_types' => $services]);
}

test('pre employment PDFs keep history and physical findings in the main form without duplicate attachment pages', function (string $purpose) {
    $appointment = verifiableReportAppointment(['PE', 'CBC', 'X-Ray']);
    $appointment->update(['examination_purpose' => $purpose]);
    $physical = $appointment->physicalExam()->create(['doctor_id' => $appointment->doctor_id, 'classification' => 'Class A', 'is_completed' => true, 'height' => 170]);
    $history = $appointment->medicalHistory()->create(['present_illness' => 'Recorded medical history']);
    $laboratory = $appointment->labResult()->create(['encoded_by' => $appointment->doctor_id, 'status' => 'finalized', 'finalized_at' => now(), 'cbc_results' => ['hemoglobin' => '14']]);
    $xray = $appointment->xrayReport()->create(['radiologist_id' => $appointment->doctor_id, 'status' => 'completed', 'is_completed' => true, 'verified_at' => now(), 'findings' => 'Recorded X-ray findings']);
    $html = view('pdf.physical-examination-report', [
        'appointment' => $appointment, 'examination' => $appointment->medicalExamination,
        'physical' => $physical, 'history' => $history, 'laboratory' => $laboratory, 'xray' => $xray,
        'laboratorySections' => app(\App\Services\LaboratoryFormDefinition::class)->sectionsFor($appointment),
    ])->render();
    expect($html)->toContain('I. MEDICAL HISTORY')->toContain('II. PHYSICAL EXAMINATION')
        ->toContain('Recorded medical history')->toContain('170.00')
        ->toContain('Complete Blood Count')->toContain('Chest X-Ray Report')->toContain('Recorded X-ray findings');
    if ($purpose === 'pre_employment') {
        expect($html)->not->toContain('<h2>Medical History</h2>')->not->toContain('<h2>Physical Examination</h2>');
    } else {
        expect($html)->toContain('<h2>Medical History</h2>')->toContain('<h2>Physical Examination</h2>');
    }
})->with(['pre_employment', 'annual_pe']);

test('final laboratory reports get stable public links with only masked metadata and live withdrawal', function () {
    $appointment = verifiableReportAppointment();
    $lab = $appointment->labResult()->create(['encoded_by' => $appointment->doctor_id, 'status' => 'draft', 'cbc_results' => ['private' => 'PRIVATE-RESULT']]);
    $service = app(ReportVerificationService::class);
    expect($service->documentData($lab))->toBe([]);
    $lab->update(['status' => 'finalized', 'finalized_at' => now()]);
    $data = $service->documentData($lab);
    expect($data['verificationUrl'])->toStartWith('https://lmichealth.company/verify/report/')
        ->and($service->documentData($lab)['verificationUrl'])->toBe($data['verificationUrl']);
    $path = parse_url($data['verificationUrl'], PHP_URL_PATH);
    $response = $this->get($path)->assertOk()->assertSee('Laboratory report')->assertSee('Finalized')
        ->assertDontSee('Private Patient')->assertDontSee('PRIVATE-RESULT')
        ->assertHeader('Referrer-Policy', 'no-referrer');
    expect($response->headers->get('Cache-Control'))->toContain('no-store');
    $lab->update(['status' => 'draft', 'finalized_at' => null]);
    $this->get($path)->assertOk()->assertSee('Withdrawn')->assertDontSee('PRIVATE-RESULT');
    $lab->update(['status' => 'finalized', 'finalized_at' => now()]);
    $appointment->update(['status' => 'cancelled']);
    $this->get($path)->assertOk()->assertSee('Withdrawn');
});

test('xray and examination verification require their official verification and release states', function () {
    $appointment = verifiableReportAppointment(['PE', 'X-Ray']);
    $xray = $appointment->xrayReport()->create(['radiologist_id' => $appointment->doctor_id, 'status' => 'awaiting_result', 'findings' => 'PRIVATE-XRAY']);
    $exam = $appointment->medicalExamination;
    $exam->update(['finalized_at' => now(), 'final_diagnosis' => 'PRIVATE-DIAGNOSIS']);
    $service = app(ReportVerificationService::class);
    expect($service->documentData($xray))->toBe([])->and($service->documentData($exam))->toBe([]);
    $xray->update(['status' => 'completed', 'is_completed' => true, 'verified_at' => now()]);
    $exam->update(['released_at' => now()]);
    foreach ([$xray, $exam] as $report) {
        $data = $service->documentData($report);
        $this->get(parse_url($data['verificationUrl'], PHP_URL_PATH))->assertOk()
            ->assertDontSee('PRIVATE-XRAY')->assertDontSee('PRIVATE-DIAGNOSIS');
    }
});

test('unverified drug results do not receive official laboratory verification', function () {
    $appointment = verifiableReportAppointment(['Drug Test']);
    $lab = $appointment->labResult()->create(['encoded_by' => $appointment->doctor_id, 'status' => 'finalized', 'finalized_at' => now()]);
    expect(app(ReportVerificationService::class)->documentData($lab))->toBe([]);
});

test('released company downloads include a verification sheet without changing the saved results workbook', function () {
    Storage::fake('local');
    $company = Company::create(['company_name' => 'Private Company']);
    $representative = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $event = Appointment::create(['user_id' => $representative->id, 'company_id' => $company->id,
        'appointment_date' => today(), 'type' => 'company_bulk', 'status' => 'completed', 'service_types' => ['CBC']]);
    $book = new Spreadsheet;
    $book->getActiveSheet()->setTitle('Medical Results')->setCellValue('A1', 'PRIVATE-EMPLOYEE-RESULT');
    $book->getActiveSheet()->setCellValueExplicit('B1', '=1+1', DataType::TYPE_STRING);
    $book->getActiveSheet()->setCellValueExplicit('A2', '000123', DataType::TYPE_STRING);
    $path = 'bulk-reports/example.xlsx';
    Storage::disk('local')->makeDirectory('bulk-reports');
    (new Xlsx($book))->save(Storage::disk('local')->path($path));
    $book->disconnectWorksheets();
    $original = Storage::disk('local')->get($path);
    $report = BulkMedicalReport::create(['bulk_appointment_id' => $event->id, 'company_id' => $company->id,
        'status' => 'ready_for_review', 'file_path' => $path, 'row_count' => 1, 'columns' => [], 'generated_by' => $representative->id, 'generated_at' => now()]);
    $service = app(ReportVerificationService::class);
    expect($service->documentData($report))->toBe([]);
    $report->update(['status' => 'released', 'released_at' => now()]);
    $response = $this->actingAs($representative)->get(route('company.bulk-medical-results.download', $event))->assertOk();
    Storage::disk('local')->put('downloaded.xlsx', $response->getContent());
    $download = IOFactory::load(Storage::disk('local')->path('downloaded.xlsx'));
    try {
        expect($download->getSheetByName('Verification'))->not->toBeNull()
            ->and($download->getSheetByName('Medical Results')->getCell('A1')->getValue())->toBe('PRIVATE-EMPLOYEE-RESULT')
            ->and($download->getSheetByName('Medical Results')->getCell('B1')->getValue())->toBe('=1+1')
            ->and($download->getSheetByName('Medical Results')->getCell('B1')->getDataType())->toBe(DataType::TYPE_STRING)
            ->and($download->getSheetByName('Medical Results')->getCell('A2')->getValue())->toBe('000123')
            ->and(Storage::disk('local')->get($path))->toBe($original);
    } finally {
        $download->disconnectWorksheets();
    }
    $data = $service->documentData($report);
    $this->get(parse_url($data['verificationUrl'], PHP_URL_PATH))->assertOk()->assertSee('Company bulk report')
        ->assertDontSee('Private Company')->assertDontSee('PRIVATE-EMPLOYEE-RESULT');
});

test('unknown report verification links reveal no records', function () {
    $this->get('/verify/report/'.str_repeat('z', 64))->assertNotFound();
    $this->get('/verify/report/1')->assertNotFound();
});

test('all clinical PDF exports render a QR and keep unauthorized downloads blocked', function (string $kind) {
    $appointment = verifiableReportAppointment(match ($kind) {
        'examination', 'annual_examination' => ['PE'], 'xray' => ['X-Ray'], default => ['CBC']
    });
    $exam = $appointment->medicalExamination;
    if (in_array($kind, ['examination', 'annual_examination'], true)) {
        $appointment->update(['examination_purpose' => $kind === 'examination' ? 'pre_employment' : 'annual_pe']);
        $exam->update(['finalized_at' => now(), 'released_at' => now()]);
        $appointment->physicalExam()->create(['doctor_id' => $appointment->doctor_id, 'medical_examination_id' => $exam->id, 'classification' => 'Class A', 'is_completed' => true]);
    } elseif ($kind === 'xray') {
        $appointment->xrayReport()->create(['radiologist_id' => $appointment->doctor_id, 'status' => 'completed', 'is_completed' => true, 'verified_at' => now()]);
    } else {
        $appointment->labResult()->create(['encoded_by' => $appointment->doctor_id, 'status' => 'finalized', 'finalized_at' => now(), 'cbc_results' => ['hemoglobin' => '14']]);
    }
    $route = match ($kind) {
        'examination', 'annual_examination' => route('clinical-forms.physical-exam.pdf', $appointment),
        'xray' => route('clinical-forms.xray.pdf', $appointment),
        'laboratory_section' => route('clinical-forms.laboratory.section.pdf', [$appointment, 'cbc']),
        default => route('clinical-forms.laboratory.pdf', $appointment),
    };
    $qrBoxes = [];
    $qrPages = [];
    $headers = [];
    $this->app->afterResolving('dompdf.wrapper', function ($pdf) use (&$qrBoxes, &$qrPages, &$headers): void {
        $pdf->getDomPDF()->setCallbacks([['event' => 'end_frame', 'f' => function ($frame) use ($pdf, &$qrBoxes, &$qrPages, &$headers): void {
            $node = $frame->get_node();
            if ($node instanceof DOMElement && $node->getAttribute('class') === 'header') {
                $headers[] = ['text' => $node->textContent, 'box' => $frame->get_border_box()];
            }
            if ($node instanceof DOMElement && $node->nodeName === 'img' && $node->getAttribute('alt') === 'Scan to verify report') {
                $qrBoxes[] = $frame->get_border_box();
                $qrPages[] = $pdf->getDomPDF()->getCanvas()->get_page_number();
            }
        }]]);
    });
    $this->actingAs(User::factory()->create(['role' => 'admin']))->get($route)->assertOk()->assertHeader('content-type', 'application/pdf');
    expect($qrBoxes)->toHaveCount(1)
        ->and($qrPages)->toBe([1])
        ->and($qrBoxes[0]['w'])->toBeGreaterThan(40)
        ->and($qrBoxes[0]['x'])->toBeGreaterThanOrEqual(0);
    expect($headers)->not->toBeEmpty();
    if (in_array($kind, ['examination', 'annual_examination'], true)) {
        expect($qrBoxes[0]['x'])->toBeGreaterThan(530)
            ->and($qrBoxes[0]['y'])->toBeLessThan(30);
    }
    foreach ($headers as $header) {
        expect($header['text'])->toContain('Living Myth Industrial Clinic')->toContain('Telephone No. (049) 576-0715')
            ->and($header['box']['x'])->toBe(21.0);
    }
    $this->actingAs(User::factory()->create(['role' => 'patient']))->get($route)->assertForbidden();
})->with(['examination', 'annual_examination', 'xray', 'laboratory', 'laboratory_section']);
