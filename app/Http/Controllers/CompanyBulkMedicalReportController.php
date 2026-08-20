<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\SecurityAudit;
use App\Services\CompanyBulkMedicalReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanyBulkMedicalReportController extends Controller
{
    public function show(Request $request, Appointment $event, CompanyBulkMedicalReportService $reports): Response
    {
        $this->adminEvent($request, $event);
        $event->load(['company:id,company_name', 'bulkMedicalReport.generatedBy:id,first_name,last_name', 'bulkMedicalReport.releasedBy:id,first_name,last_name']);

        return Inertia::render('admin/onsite-events/results', [
            'event' => $event->only(['id', 'appointment_date', 'service_types', 'status']) + ['company' => $event->company],
            'summary' => $reports->summary($event), 'preview' => $reports->preview($event),
            'report' => $event->bulkMedicalReport,
        ]);
    }

    public function generate(Request $request, Appointment $event, CompanyBulkMedicalReportService $reports)
    {
        $this->adminEvent($request, $event);
        abort_if($event->bulkMedicalReport?->released_at, 422, 'A released report is locked and cannot be regenerated.');
        $report = $reports->generate($event, $request->user());
        $this->audit($request, $event, 'bulk_medical_report_generated', ['report_id' => $report->id]);

        return back()->with('success', 'Final Excel report generated and ready for admin review.');
    }

    public function release(Request $request, Appointment $event)
    {
        $this->adminEvent($request, $event);
        $report = $event->bulkMedicalReport;
        abort_unless($report && Storage::disk('local')->exists($report->file_path), 422, 'Generate the final report before releasing it.');
        abort_if($report->released_at, 422, 'This report has already been released.');
        $report->update(['status' => 'released', 'released_by' => $request->user()->id, 'released_at' => now()]);
        $this->audit($request, $event, 'bulk_medical_report_released', ['report_id' => $report->id]);

        return back()->with('success', 'The report is now available to the company account.');
    }

    public function adminDownload(Request $request, Appointment $event)
    {
        $this->adminEvent($request, $event);

        return $this->download($event);
    }

    public function companyDownload(Request $request, Appointment $event)
    {
        abort_unless($event->isBulkParent() && $event->company_id === $request->user()->company_id, 403);
        abort_unless($event->bulkMedicalReport?->released_at, 404, 'The final report has not been released yet.');

        return $this->download($event);
    }

    private function adminEvent(Request $request, Appointment $event): void
    {
        abort_unless($request->user()->role === 'admin' && $event->isBulkParent(), 403);
    }

    private function download(Appointment $event)
    {
        $report = $event->bulkMedicalReport;
        abort_unless($report && Storage::disk('local')->exists($report->file_path), 404);
        $company = str($event->company?->company_name ?? 'company')->slug();

        return Storage::disk('local')->download($report->file_path, "{$company}-medical-results.xlsx");
    }

    private function audit(Request $request, Appointment $event, string $action, array $metadata): void
    {
        SecurityAudit::create(['actor_id' => $request->user()->id, 'target_user_id' => $event->user_id,
            'action' => $action, 'status' => 'success', 'metadata' => $metadata + ['bulk_appointment_id' => $event->id]]);
    }
}
