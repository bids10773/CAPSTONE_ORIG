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
        $appointment->load(['user.patientProfile', 'company', 'physicalExam.doctor', 'medicalHistory']);
        abort_unless($appointment->physicalExam, 404, 'No physical examination exists.');
        $workflow->auditDocumentAccess($appointment, $request->user(), 'physical_exam', $request);

        return $this->render($request, $appointment, 'Physical Examination', $appointment->physicalExam->toArray(), 'physical-exam');
    }

    public function xray(Request $request, Appointment $appointment, ClinicalFormWorkflowService $workflow): Response
    {
        Gate::authorize('viewClinicalForms', $appointment);
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
}
