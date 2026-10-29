<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Services\ClinicalFormWorkflowService;
use App\Services\LaboratoryFormDefinition;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class ClinicalDocumentController extends Controller
{
    public function physicalExam(Request $request, Appointment $appointment, ClinicalFormWorkflowService $workflow, LaboratoryFormDefinition $definitions): Response
    {
        $this->loadPeAppointment($request, $appointment);
        $workflow->auditDocumentAccess($appointment, $request->user(), 'physical_exam', $request);

        $pdf = Pdf::loadView('pdf.physical-examination-report', [
            'appointment' => $appointment,
            'examination' => $appointment->medicalExamination,
            'physical' => $appointment->physicalExam,
            'history' => $appointment->medicalHistory,
            'laboratory' => $appointment->labResult,
            'xray' => $appointment->xrayReport,
            'laboratorySections' => $definitions->sectionsFor($appointment),
            ...app(\App\Services\ReportVerificationService::class)->documentData($appointment->medicalExamination),
        ])->setPaper('letter', 'portrait');
        $filename = "medicalexam-pdf-{$appointment->reference_code}.pdf";

        return $this->secure($request->boolean('preview') ? $pdf->stream($filename) : $pdf->download($filename));
    }

    private function loadPeAppointment(Request $request, Appointment $appointment): void
    {
        Gate::authorize('viewPhysicalExam', $appointment);
        $this->ensurePatientResultIsReleased($request, $appointment, 'physical_exam');
        abort_unless($appointment->isPePackage(), 404, 'This appointment has no PE form.');
        $appointment->load([
            'user.patientProfile', 'company', 'medicalExamination.examiningDoctor',
            'medicalExamination.finalizedBy', 'medicalExamination.diagnosticResults',
            'physicalExam.doctor', 'medicalHistory', 'labResult.encodedBy',
            'labResult.verifiedBy', 'xrayReport.verifiedBy', 'xrayReport.radiologist',
        ]);
        abort_unless($appointment->physicalExam, 404, 'No physical examination exists.');
    }

    public function xray(Request $request, Appointment $appointment, ClinicalFormWorkflowService $workflow): Response
    {
        Gate::authorize('viewXray', $appointment);
        $this->ensurePatientResultIsReleased($request, $appointment, 'xray');
        $appointment->load(['user.patientProfile', 'company', 'xrayReport.radiologist', 'xrayReport.verifiedBy']);
        abort_unless($appointment->xrayReport, 404, 'No X-ray report exists.');
        $workflow->auditDocumentAccess($appointment, $request->user(), 'xray', $request);

        return $this->render($request, $appointment, 'Chest X-Ray Report', [
            'Findings' => $appointment->xrayReport->findings,
            'Impression' => $appointment->xrayReport->impression,
            'Recommendation' => $appointment->xrayReport->recommendation,
            'Remarks' => $appointment->xrayReport->remarks,
            'Performed date' => $appointment->xrayReport->performed_at?->format('F j, Y g:i A'),
            'Verification date' => $appointment->xrayReport->verified_at?->format('F j, Y g:i A'),
        ], 'xray');
    }

    private function render(Request $request, Appointment $appointment, string $title, array $fields, string $slug): Response
    {
        $pdf = Pdf::loadView('pdf.clinical-report', [
            ...compact('appointment', 'title', 'fields'),
            ...app(\App\Services\ReportVerificationService::class)->documentData($appointment->xrayReport),
        ])->setPaper('letter');
        $filename = "LMIC-{$slug}-{$appointment->id}.pdf";

        return $this->secure($request->boolean('preview') ? $pdf->stream($filename) : $pdf->download($filename));
    }

    private function secure(Response $response): Response
    {
        $response->headers->set('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');

        return $response;
    }

    private function ensurePatientResultIsReleased(Request $request, Appointment $appointment, string $documentType): void
    {
        if (! in_array($request->user()->role, ['patient', 'company'], true)) {
            return;
        }

        abort_unless($appointment->status === 'completed', 403, 'The appointment is not completed yet.');

        if ($appointment->isPePackage()) {
            $appointment->loadMissing('medicalExamination');
            abort_unless($appointment->medicalExamination?->released_at !== null, 403, 'The final medical examination report has not been released yet.');

            if ($documentType === 'physical_exam') {
                return;
            }
        }

        if ($documentType === 'xray') {
            $appointment->loadMissing('xrayReport');
            abort_unless($appointment->xrayReport?->isVerified(), 403, 'The official X-ray result has not been verified yet.');
        }
    }
}
