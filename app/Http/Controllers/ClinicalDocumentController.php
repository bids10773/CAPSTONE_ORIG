<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\SecurityAudit;
use App\Services\ClinicalFormWorkflowService;
use App\Services\LaboratoryFormDefinition;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ClinicalDocumentController extends Controller
{
    public function physicalExam(Request $request, Appointment $appointment, ClinicalFormWorkflowService $workflow, LaboratoryFormDefinition $definitions): Response
    {
        $this->denyPatientAccess($request, $appointment, 'physical_exam');
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
        ])->setPaper('letter', 'portrait');
        $filename = "LMIC-Complete-PE-{$appointment->id}.pdf";

        return $this->secure($request->boolean('preview') ? $pdf->stream($filename) : $pdf->download($filename));
    }

    private function loadPeAppointment(Request $request, Appointment $appointment): void
    {
        Gate::authorize('viewPhysicalExam', $appointment);
        $this->ensurePatientResultIsReleased($request, $appointment);
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
        $this->denyPatientAccess($request, $appointment, 'xray');
        Gate::authorize('viewXray', $appointment);
        $this->ensurePatientResultIsReleased($request, $appointment);
        $appointment->load(['user.patientProfile', 'company', 'xrayReport.radiologist', 'xrayReport.verifiedBy']);
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

        return $this->secure($request->boolean('preview') ? $pdf->stream($filename) : $pdf->download($filename));
    }

    private function denyPatientAccess(Request $request, Appointment $appointment, string $type): void
    {
        if ($request->user()?->role !== 'patient') {
            return;
        }
        Log::warning('Blocked patient medical document access', ['user_id' => $request->user()->id,
            'appointment_id' => $appointment->id, 'document_type' => $type, 'ip_address' => $request->ip()]);
        SecurityAudit::create(['actor_id' => $request->user()->id, 'target_user_id' => $appointment->user_id,
            'action' => 'patient_medical_document_access_denied', 'status' => 'denied',
            'metadata' => ['appointment_id' => $appointment->id, 'document_type' => $type]]);
        abort(403, 'Medical documents are released by authorized clinic personnel.');
    }

    private function secure(Response $response): Response
    {
        $response->headers->set('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');

        return $response;
    }

    private function ensurePatientResultIsReleased(Request $request, Appointment $appointment): void
    {
        if (! in_array($request->user()->role, ['patient', 'company'], true)) {
            return;
        }

        abort_unless($appointment->status === 'completed', 403, 'The appointment is not completed yet.');

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
