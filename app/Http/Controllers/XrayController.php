<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveXrayReportRequest;
use App\Models\Appointment;
use App\Models\ClinicalFormAudit;
use App\Models\XrayReport;
use App\Services\MedicalExaminationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class XrayController extends Controller
{
    public function create(Appointment $appointment): Response
    {
        Gate::authorize('updateXray', $appointment);
        app(\App\Services\OnsiteEventWorkflowService::class)->startService($appointment, 'radtech', request()->user());
        $appointment->load(['user', 'company', 'medicalExamination', 'xrayReport', 'patientProfile']);

        return Inertia::render('radtech/xray-report-form', [
            'appointment' => $appointment, 'xrayReport' => $appointment->xrayReport,
            'locked' => ($appointment->medicalExamination?->finalized_at !== null || $appointment->xrayReport?->isVerified())
                && request()->user()->role !== 'admin',
            'submitUrl' => request()->user()->role === 'admin'
                ? route('admin.xrays.update', $appointment)
                : route('radtech.xrays.store', $appointment),
        ]);
    }

    public function store(SaveXrayReportRequest $request, Appointment $appointment, MedicalExaminationService $examinations): RedirectResponse
    {
        app(\App\Services\OnsiteEventWorkflowService::class)->startService($appointment, 'radtech', $request->user());
        DB::transaction(function () use ($request, $appointment, $examinations): void {
            $medicalExamination = $examinations->forAppointment($appointment);
            $existing = XrayReport::query()->where('appointment_id', $appointment->id)->lockForUpdate()->first();
            if (($medicalExamination->finalized_at || $existing?->isVerified() || $existing?->finalized_at) && $request->user()->role !== 'admin') {
                throw ValidationException::withMessages(['form' => 'The X-ray report is finalized and locked.']);
            }
            $action = $request->validated('workflow_action');
            $complete = $action === 'complete';
            $report = XrayReport::updateOrCreate(['appointment_id' => $appointment->id], [
                'medical_examination_id' => $medicalExamination->id,
                'radiologist_id' => $existing?->radiologist_id ?? $request->user()->id,
                'findings' => $request->validated('chest_findings'),
                'impression' => $request->validated('impression'),
                'recommendation' => $request->validated('recommendation'),
                'remarks' => $request->validated('remarks'),
                'status' => $complete ? 'completed' : 'awaiting_result',
                'performed_at' => $existing?->performed_at ?? now(),
                'result_available_at' => $complete ? now() : null,
                'verified_by' => $complete ? $request->user()->id : null,
                'verified_at' => $complete ? now() : null,
                'is_completed' => $complete,
                'finalized_by' => $complete ? $request->user()->id : null,
                'finalized_at' => $complete ? now() : null,
                'sent_for_verification_by' => null,
                'sent_for_verification_at' => null,
            ]);
            if ($complete) {
                app(\App\Services\OnsiteEventWorkflowService::class)->completeService($appointment, 'radtech', $request->user());
            }
            app(\App\Services\EmployeeMedicalStatusResolver::class)->resolve($appointment->fresh());
            ClinicalFormAudit::create([
                'appointment_id' => $appointment->id, 'actor_id' => $request->user()->id,
                'form_type' => 'xray', 'action' => $complete ? 'result_verified' : 'procedure_performed',
                'changes' => $report->getChanges(), 'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(),
            ]);
        });

        $message = match ($request->validated('workflow_action')) {
            'complete' => 'X-Ray result verified and finalized by RadTech.',
            default => 'X-Ray saved as pending. The examination remains available until it is finalized.',
        };

        $destination = $appointment->bulk_appointment_id !== null
            ? route('radtech.onsite-events.show', $appointment->bulk_appointment_id)
            : route('radtech.appointments');

        return redirect()->to($destination)->with('success', $message);
    }
}
