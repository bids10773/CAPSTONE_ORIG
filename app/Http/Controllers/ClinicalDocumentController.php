<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Services\ClinicalFormWorkflowService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class ClinicalDocumentController extends Controller
{
    public function physicalExam(Request $request, Appointment $appointment, ClinicalFormWorkflowService $workflow): Response
    {
        Gate::authorize('viewClinicalForms', $appointment);
        $this->ensurePatientResultIsReleased($request, $appointment);
        $appointment->load([
            'user.patientProfile', 'company', 'medicalExamination.examiningDoctor',
            'medicalExamination.finalizedBy', 'medicalExamination.diagnosticResults',
            'physicalExam.doctor', 'medicalHistory', 'labResult', 'xrayReport.verifiedBy',
        ]);
        abort_unless($appointment->physicalExam, 404, 'No physical examination exists.');
        $workflow->auditDocumentAccess($appointment, $request->user(), 'physical_exam', $request);

        $pdf = Pdf::loadView('pdf.physical-examination-report', [
            'appointment' => $appointment,
            'examination' => $appointment->medicalExamination,
            'physical' => $appointment->physicalExam,
            'history' => $appointment->medicalHistory,
            'laboratory' => $appointment->labResult,
            'xray' => $appointment->xrayReport,
        ])->setPaper('letter', 'portrait');
        $filename = "LMIC-Physical-Examination-{$appointment->id}.pdf";

        return $request->boolean('preview') ? $pdf->stream($filename) : $pdf->download($filename);
    }

    public function xray(Request $request, Appointment $appointment, ClinicalFormWorkflowService $workflow): Response
    {
        Gate::authorize('viewClinicalForms', $appointment);
        $this->ensurePatientResultIsReleased($request, $appointment);
        $appointment->load(['user.patientProfile', 'company', 'xrayReport.radiologist']);
        abort_unless($appointment->xrayReport, 404, 'No X-ray report exists.');
        $workflow->auditDocumentAccess($appointment, $request->user(), 'xray', $request);

        return $this->render($request, $appointment, 'Chest X-Ray Report', [
            'Findings' => $appointment->xrayReport->findings,
            'Impression' => $appointment->xrayReport->impression,
        ], 'xray');
    }

    private function render(Request $request, Appointment $appointment, string $title, array $fields, string $slug): Response
    {
        $pdf = Pdf::loadView('pdf.clinical-report', compact('appointment', 'title', 'fields'))->setPaper('letter');
        $filename = "LMIC-{$slug}-{$appointment->id}.pdf";

        return $request->boolean('preview') ? $pdf->stream($filename) : $pdf->download($filename);
    }

    private function ensurePatientResultIsReleased(Request $request, Appointment $appointment): void
    {
        if ($request->user()->role !== 'patient') {
            return;
        }

        if ($appointment->isPePackage()) {
            $appointment->loadMissing('medicalExamination');
            abort_unless($appointment->medicalExamination?->released_at !== null, 403, 'The final PE report has not been released yet.');

            return;
        }

        if ($appointment->requiresXray()) {
            $appointment->loadMissing('xrayReport');
            abort_unless($appointment->xrayReport?->isVerified(), 403, 'The official X-ray result has not been verified yet.');
        }
    }
}
