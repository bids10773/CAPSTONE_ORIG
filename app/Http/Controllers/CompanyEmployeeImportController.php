<?php

namespace App\Http\Controllers;

use App\Http\Requests\ConfirmCompanyEmployeeImportRequest;
use App\Http\Requests\PreviewCompanyEmployeeImportRequest;
use App\Models\SecurityAudit;
use App\Services\CompanyEmployeeImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CompanyEmployeeImportController extends Controller
{
    public function preview(
        PreviewCompanyEmployeeImportRequest $request,
        CompanyEmployeeImportService $service
    ): Response|RedirectResponse {
        try {
            $preview = $service->preview($request->file('file'), (int) $request->user()->company_id);
            $token = (string) Str::uuid();
            Cache::put($this->cacheKey($request->user()->id, $token), $preview, now()->addMinutes(30));

            return Inertia::render('company/dashboard', [
                ...app(CompanyDashboardController::class)->data($request),
                'importPreview' => [...$preview, 'token' => $token],
            ]);
        } catch (\RuntimeException $exception) {
            return back()->withErrors(['file' => $exception->getMessage()]);
        } catch (\Throwable) {
            return back()->withErrors(['file' => 'The spreadsheet could not be read. Check the file format and try again.']);
        }
    }

    public function confirm(
        ConfirmCompanyEmployeeImportRequest $request,
        CompanyEmployeeImportService $service
    ): RedirectResponse {
        $key = $this->cacheKey($request->user()->id, $request->validated('preview_token'));
        $preview = Cache::get($key);

        if (! $preview) {
            return back()->withErrors(['preview_token' => 'This preview expired. Upload the spreadsheet again.']);
        }

        try {
            $result = $service->import($preview, (int) $request->user()->company_id);
            Cache::put($key.'.result', ['preview' => $preview, 'result' => $result], now()->addMinutes(30));
            Cache::forget($key);

            SecurityAudit::create([
                'actor_id' => $request->user()->id,
                'action' => 'company_employee_import_completed',
                'status' => $result['failed'] > 0 ? 'partial' : 'success',
                'metadata' => [
                    ...$result,
                    'file_name' => $preview['file_name'],
                ],
            ]);

            return redirect()->route('company.dashboard')
                ->with('success', "{$result['imported']} employees imported; {$result['duplicates']} duplicates skipped.")
                ->with('import_result', [...$result, 'report_token' => $request->validated('preview_token')]);
        } catch (\Throwable) {
            return back()->withErrors(['preview_token' => 'The import could not be completed. No partial records were saved.']);
        }
    }

    public function template(): BinaryFileResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Employees');
        $sheet->fromArray([
            ['First Name', 'Last Name', 'Sex', 'Birthdate'],
            ['Juan', 'Dela Cruz', 'Male', '2000-05-15'],
        ]);
        $sheet->getStyle('A1:D1')->getFont()->setBold(true);
        foreach (range('A', 'D') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $path = tempnam(sys_get_temp_dir(), 'employee-template-').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);

        return response()->download($path, 'employee-import-template.xlsx')->deleteFileAfterSend(true);
    }

    public function errorReport(Request $request, string $token): StreamedResponse
    {
        abort_unless($request->user()?->role === 'company', 403);
        $payload = Cache::get($this->cacheKey($request->user()->id, $token).'.result');
        abort_unless($payload, 404);

        return response()->streamDownload(function () use ($payload): void {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['Excel Row', 'Employee Name', 'Invalid Field', 'Reason']);
            foreach ($payload['preview']['rows'] as $row) {
                foreach ($row['errors'] as $error) {
                    fputcsv($output, [
                        $row['row'],
                        $this->safeCsv($row['first_name'].' '.$row['last_name']),
                        $this->safeCsv($error['field']),
                        $this->safeCsv($error['message']),
                    ]);
                }
            }
            fclose($output);
        }, 'employee-import-errors.csv', ['Content-Type' => 'text/csv']);
    }

    private function cacheKey(int $userId, string $token): string
    {
        return "company-employee-import:{$userId}:{$token}";
    }

    private function safeCsv(string $value): string
    {
        return preg_match('/^[=+\-@]/', $value) ? "'".$value : $value;
    }
}
