<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveLaboratoryResultRequest;
use App\Models\Appointment;
use App\Services\ClinicalFormWorkflowService;
use App\Services\LaboratoryFormDefinition;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class LaboratoryController extends Controller
{
    public function create(Appointment $appointment, LaboratoryFormDefinition $definitions): Response
    {
        Gate::authorize('updateLaboratory', $appointment);
        $appointment->load(['user.patientProfile', 'company', 'doctor', 'labResult.encodedBy']);

        return Inertia::render('medtech/lab-results-form', [
            'appointment' => $appointment,
            'labResult' => $appointment->labResult,
            'sections' => $definitions->sectionsFor($appointment),
            'patientSummary' => $this->patientSummary($appointment),
            'locked' => $appointment->labResult?->isFinalized() && request()->user()->role !== 'admin',
            'submitUrl' => request()->user()->role === 'admin'
                ? route('admin.lab-results.update', $appointment)
                : route('medtech.lab-results.store', $appointment),
        ]);
    }

    public function store(SaveLaboratoryResultRequest $request, Appointment $appointment, ClinicalFormWorkflowService $workflow): RedirectResponse
    {
        $workflow->saveLaboratory($appointment, $request->user(), $request->validated(), $request);
        $message = $request->boolean('finalize')
            ? 'Laboratory report finalized and forwarded to the next required stage.'
            : 'Laboratory draft saved successfully.';

        return redirect()->route('medtech.appointments')->with('success', $message);
    }

    public function pdf(Request $request, Appointment $appointment, LaboratoryFormDefinition $definitions, ClinicalFormWorkflowService $workflow): HttpResponse
    {
        Gate::authorize('viewClinicalForms', $appointment);
        $this->ensurePatientResultIsReleased($request, $appointment);
        $appointment->load(['user.patientProfile', 'company', 'doctor', 'labResult.encodedBy', 'labResult.verifiedBy']);
        abort_unless($appointment->labResult, 404, 'No laboratory report exists for this appointment.');
        $workflow->auditDocumentAccess($appointment, $request->user(), 'laboratory', $request);

        $pdf = Pdf::loadView('pdf.laboratory-report', [
            'appointment' => $appointment,
            'result' => $appointment->labResult,
            'sections' => $definitions->sectionsFor($appointment),
            'patient' => $this->patientSummary($appointment),
        ])->setPaper('letter');

        return $request->boolean('preview')
            ? $pdf->stream("LMIC-Laboratory-{$appointment->id}.pdf")
            : $pdf->download("LMIC-Laboratory-{$appointment->id}.pdf");
    }

    public function sectionPdf(
        Request $request,
        Appointment $appointment,
        string $section,
        LaboratoryFormDefinition $definitions,
        ClinicalFormWorkflowService $workflow,
    ): HttpResponse {
        Gate::authorize('viewClinicalForms', $appointment);
        $this->ensurePatientResultIsReleased($request, $appointment);
        $appointment->load(['user.patientProfile', 'company', 'doctor', 'labResult.encodedBy', 'labResult.verifiedBy']);

        $availableSections = $definitions->sectionsFor($appointment);
        abort_unless(array_key_exists($section, $availableSections), 404, 'This laboratory test was not selected for the appointment.');
        abort_unless($appointment->labResult, 404, 'No laboratory report exists for this appointment.');

        $column = $availableSections[$section]['column'];
        abort_unless(filled($appointment->labResult->{$column}), 404, 'This laboratory result is not available yet.');

        $workflow->auditDocumentAccess($appointment, $request->user(), "laboratory_{$section}", $request);

        $pdf = Pdf::loadView('pdf.laboratory-report', [
            'appointment' => $appointment,
            'result' => $appointment->labResult,
            'sections' => [$section => $availableSections[$section]],
            'patient' => $this->patientSummary($appointment),
        ])->setPaper('letter');
        $filename = 'LMIC-'.str($section)->replace('_', '-')->title()."-{$appointment->id}.pdf";

        return $request->boolean('preview')
            ? $pdf->stream($filename)
            : $pdf->download($filename);
    }

    private function patientSummary(Appointment $appointment): array
    {
        $profile = $appointment->user->patientProfile;

        return [
            'name' => $appointment->user->name,
            'birthdate' => $profile?->birthdate?->toDateString(),
            'age' => $profile?->birthdate?->age,
            'sex' => $profile?->sex ?? $appointment->user->sex,
            'company' => $appointment->company?->company_name ?? $appointment->company_name ?? 'OPD',
            'employee_number' => $profile?->employee_number,
            'appointment' => $appointment->id,
            'date' => $appointment->appointment_date?->toDateString(),
            'doctor' => $appointment->doctor?->name,
        ];
    }

    private function ensurePatientResultIsReleased(Request $request, Appointment $appointment): void
    {
        if ($request->user()->role === 'patient' && $appointment->isPePackage()) {
            $appointment->loadMissing('medicalExamination');
            abort_unless($appointment->medicalExamination?->released_at !== null, 403, 'The final PE report has not been released yet.');
        }
    }
}
