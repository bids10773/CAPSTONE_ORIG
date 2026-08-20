<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\BulkMedicalReport;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CompanyBulkMedicalReportService
{
    private const BASE_COLUMNS = [
        ['key' => 'number', 'label' => 'NO.'], ['key' => 'employee_number', 'label' => 'EMPLOYEE NO.'],
        ['key' => 'last_name', 'label' => 'LAST NAME'], ['key' => 'first_name', 'label' => 'FIRST NAME'],
        ['key' => 'middle_name', 'label' => 'MIDDLE NAME'],
    ];

    private const SERVICE_COLUMNS = [
        'PE' => ['key' => 'pe', 'label' => 'PHYSICAL EXAM'],
        'CBC' => ['key' => 'cbc', 'label' => 'CBC'],
        'Urinalysis' => ['key' => 'urinalysis', 'label' => 'URINALYSIS'],
        'Fecalysis' => ['key' => 'fecalysis', 'label' => 'FECALYSIS'],
        'Drug Test' => ['key' => 'drug_test', 'label' => 'DRUG TEST'],
        'Hepatitis' => ['key' => 'serology', 'label' => 'HEPATITIS'],
        'Blood Typing' => ['key' => 'blood_type', 'label' => 'BLOOD TYPE'],
        'Pregnancy Test' => ['key' => 'pregnancy', 'label' => 'PREGNANCY TEST'],
        'FBS' => ['key' => 'fbs', 'label' => 'FBS'],
        'Blood Chemistry' => ['key' => 'blood_chemistry', 'label' => 'BLOOD CHEMISTRY'],
        'X-Ray' => ['key' => 'xray', 'label' => 'CHEST X-RAY'],
        'ECG' => ['key' => 'ecg', 'label' => 'ECG'],
        'Audiometry' => ['key' => 'audiometry', 'label' => 'AUDIOMETRY'],
        'Neuro Psychiatric Test' => ['key' => 'neuro_psychiatric_test', 'label' => 'NEURO PSYCHIATRIC'],
    ];

    public function summary(Appointment $event): array
    {
        $event = $this->load($event);
        $employees = $event->bulkEmployees;
        $counts = $employees->countBy(fn (Appointment $employee) => $employee->status)->all();
        $unresolved = $employees->filter(fn (Appointment $employee) => ! $this->isResolved($employee));

        return [
            'total' => $employees->count(), 'completed' => (int) ($counts['completed'] ?? 0),
            'absent' => (int) ($counts['absent'] ?? 0), 'pending' => $unresolved->count(),
            'status_counts' => $counts, 'ready' => $employees->isNotEmpty() && $unresolved->isEmpty(),
            'blockers' => $unresolved->take(10)->map(fn ($employee) => [
                'id' => $employee->id, 'name' => $employee->user?->name, 'status' => $employee->status,
            ])->values()->all(),
        ];
    }

    public function columns(Appointment $event): array
    {
        $services = collect($event->service_types ?? []);
        if ($event->isPePackage()) {
            $services = $services->merge(config('medical.pe_package.laboratory_services', []));
            if (config('medical.pe_package.requires_xray', true)) {
                $services->push('X-Ray');
            }
        }
        $serviceColumns = $services->unique()->map(fn ($service) => self::SERVICE_COLUMNS[$service] ?? null)->filter()->values()->all();

        return [...self::BASE_COLUMNS, ...$serviceColumns,
            ['key' => 'classification', 'label' => 'CLASSIFICATION'],
            ['key' => 'remarks', 'label' => 'REMARKS'],
        ];
    }

    public function preview(Appointment $event): array
    {
        $event = $this->load($event);
        $columns = $this->columns($event);

        return ['columns' => $columns, 'rows' => $event->bulkEmployees->values()->map(
            fn ($employee, $index) => $this->row($employee, $columns, $index + 1)
        )->all()];
    }

    public function generate(Appointment $event, User $admin): BulkMedicalReport
    {
        $summary = $this->summary($event);
        if (! $summary['ready']) {
            throw ValidationException::withMessages(['report' => 'The final report is blocked until every employee is completed or marked absent, including all required result verification and final evaluation.']);
        }
        $data = $this->preview($event);
        $path = "bulk-medical-reports/{$event->id}/company-medical-results-{$event->id}.xlsx";
        Storage::disk('local')->makeDirectory(dirname($path));
        $this->writeSpreadsheet($event, $data['columns'], $data['rows'], Storage::disk('local')->path($path));

        return BulkMedicalReport::updateOrCreate(['bulk_appointment_id' => $event->id], [
            'company_id' => $event->company_id, 'status' => 'ready_for_review', 'columns' => $data['columns'],
            'row_count' => count($data['rows']), 'file_path' => $path, 'generated_by' => $admin->id,
            'generated_at' => now(), 'released_by' => null, 'released_at' => null,
        ]);
    }

    private function load(Appointment $event): Appointment
    {
        abort_unless($event->isBulkParent(), 404);

        return $event->loadMissing(['company', 'bulkEmployees.user.patientProfile', 'bulkEmployees.medicalExamination.diagnosticResults',
            'bulkEmployees.medicalExamination.physicalExam', 'bulkEmployees.medicalExamination.laboratoryResult',
            'bulkEmployees.medicalExamination.xrayReport']);
    }

    private function isResolved(Appointment $employee): bool
    {
        if ($employee->status === 'absent') {
            return true;
        }

        return $employee->status === 'completed' && $employee->medicalExamination?->finalized_at !== null;
    }

    private function row(Appointment $employee, array $columns, int $number): array
    {
        $profile = $employee->user?->patientProfile;
        $base = ['number' => $number, 'employee_number' => $profile?->employee_number ?: '-',
            'last_name' => $employee->user?->last_name ?: '-', 'first_name' => $employee->user?->first_name ?: '-',
            'middle_name' => $employee->user?->middle_name ?: '-'];
        if ($employee->status === 'absent') {
            return collect($columns)->mapWithKeys(fn ($column) => [$column['key'] => $base[$column['key']] ?? ($column['key'] === 'remarks' ? 'ABSENT' : '-')])->all();
        }
        $exam = $employee->medicalExamination;
        $diagnostics = $exam?->diagnosticResults?->keyBy('service_key') ?? collect();
        $lab = $exam?->laboratoryResult;
        $values = [
            'pe' => $exam?->physicalExam?->remarks ?: 'COMPLETED',
            'cbc' => $this->labSummary($diagnostics->get('cbc'), $lab?->cbc_results),
            'urinalysis' => $this->labSummary($diagnostics->get('urinalysis'), $lab?->urinalysis_results),
            'fecalysis' => $this->labSummary($diagnostics->get('fecalysis'), $lab?->fecalysis_results),
            'drug_test' => $this->verifiedDiagnostic($diagnostics->get('drug_test')),
            'serology' => $this->labSummary($diagnostics->get('serology'), $lab?->serology_results),
            'blood_type' => $this->arrayText($lab?->blood_type),
            'pregnancy' => $this->isFemale($employee) ? $this->arrayText($lab?->pregnancy_test) : '-',
            'fbs' => filled(data_get($lab?->blood_chemistry_results, 'fbs')) ? data_get($lab?->blood_chemistry_results, 'fbs').' mg/dL' : '-',
            'blood_chemistry' => $this->arrayText($lab?->blood_chemistry_results),
            'xray' => $exam?->xrayReport?->isVerified() ? ($exam->xrayReport->impression ?: $exam->xrayReport->findings ?: 'FINAL') : '-',
            'ecg' => $this->verifiedDiagnostic($diagnostics->get('ecg')),
            'audiometry' => $this->verifiedDiagnostic($diagnostics->get('audiometry')),
            'neuro_psychiatric_test' => $this->verifiedDiagnostic($diagnostics->get('neuro_psychiatric_test')),
            'classification' => $exam?->medical_classification ?: $exam?->physicalExam?->classification ?: '-',
            'remarks' => $exam?->final_remarks ?: $exam?->recommendations ?: '-',
        ];

        return collect($columns)->mapWithKeys(fn ($column) => [$column['key'] => $base[$column['key']] ?? $values[$column['key']] ?? '-'])->all();
    }

    private function labSummary($diagnostic, mixed $result): string
    {
        if ($diagnostic && ! $diagnostic->isVerified()) {
            return '-';
        }
        if ($diagnostic?->findings) {
            return $diagnostic->findings;
        }

        return $this->arrayText($result);
    }

    private function verifiedDiagnostic($diagnostic): string
    {
        return $diagnostic?->isVerified() ? ($diagnostic->findings ?: $this->arrayText($diagnostic->result_data)) : '-';
    }

    private function arrayText(mixed $value): string
    {
        if (! is_array($value)) {
            return filled($value) ? (string) $value : '-';
        }
        $parts = collect($value)->filter(fn ($v) => filled($v))->map(fn ($v, $k) => str($k)->replace('_', ' ')->title().': '.$v);

        return $parts->isEmpty() ? '-' : $parts->implode('; ');
    }

    private function isFemale(Appointment $employee): bool
    {
        return in_array(strtolower((string) ($employee->user?->patientProfile?->sex ?? $employee->user?->sex)), ['female', 'f'], true);
    }

    private function writeSpreadsheet(Appointment $event, array $columns, array $rows, string $path): void
    {
        $book = new Spreadsheet;
        $sheet = $book->getActiveSheet();
        $sheet->setTitle('Medical Results');
        $last = Coordinate::stringFromColumnIndex(count($columns));
        $sheet->mergeCells("A1:{$last}1")->setCellValue('A1', 'COMPANY BULK MEDICAL RESULTS');
        $sheet->mergeCells("A2:{$last}2")->setCellValue('A2', $event->company?->company_name ?? 'Company');
        $sheet->mergeCells("A3:{$last}3")->setCellValue('A3', 'Examination date: '.$event->appointment_date?->format('F j, Y').'  |  Generated: '.now()->format('F j, Y g:i A'));
        $sheet->mergeCells("A4:{$last}4")->setCellValue('A4', 'Selected services: '.implode(', ', $event->service_types ?? []));
        $sheet->mergeCells("A5:{$last}5")->setCellValue('A5', 'Employees: '.count($rows));
        foreach ($columns as $i => $column) {
            $sheet->setCellValue([$i + 1, 7], $column['label']);
        }
        foreach ($rows as $r => $row) {
            foreach ($columns as $c => $column) {
                $sheet->setCellValue([$c + 1, $r + 8], $row[$column['key']] ?? '-');
            }
        }
        $sheet->freezePane('F8')->setAutoFilter("A7:{$last}7");
        $sheet->getStyle("A1:{$last}1")->getFont()->setBold(true)->setSize(16)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle("A1:{$last}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF365314');
        $sheet->getStyle("A7:{$last}7")->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle("A7:{$last}7")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4D7C0F');
        $sheet->getStyle("A7:{$last}".(count($rows) + 7))->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFD1D5DB');
        $sheet->getStyle("A1:{$last}".(count($rows) + 7))->getAlignment()->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
        foreach (range(1, count($columns)) as $column) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($column))->setWidth($column <= 5 ? 18 : 25);
        }
        $sheet->getPageSetup()->setOrientation('landscape')->setFitToWidth(1)->setFitToHeight(0);
        (new Xlsx($book))->save($path);
        $book->disconnectWorksheets();
    }
}
