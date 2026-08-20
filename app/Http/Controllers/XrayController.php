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
            'locked' => $appointment->medicalExamination?->finalized_at !== null && request()->user()->role !== 'admin',
            'submitUrl' => request()->user()->role === 'admin'
                ? route('admin.xrays.update', $appointment)
                : route('radtech.xrays.store', $appointment),
        ]);
    }

    public function store(SaveXrayReportRequest $request, Appointment $appointment, MedicalExaminationService $examinations): RedirectResponse
    {
        app(\App\Services\OnsiteEventWorkflowService::class)->startService($appointment, 'radtech', $request->user());
        if (($appointment->medicalExamination?->finalized_at || $appointment->xrayReport?->finalized_at) && $request->user()->role !== 'admin') {
            throw ValidationException::withMessages(['form' => 'The X-ray report is finalized and locked.']);
        }

        DB::transaction(function () use ($request, $appointment, $examinations): void {
            $medicalExamination = $examinations->forAppointment($appointment);
            $action = $request->validated('workflow_action');
            $complete = $action === 'complete';
            $sendForVerification = $action === 'send_verification';
            if ($sendForVerification && $appointment->xrayReport?->sent_for_verification_at) {
                throw ValidationException::withMessages(['workflow_action' => 'This X-ray has already been sent for verification.']);
            }
            $report = XrayReport::updateOrCreate(['appointment_id' => $appointment->id], [
                'medical_examination_id' => $medicalExamination->id,
                'radiologist_id' => $request->user()->id,
                'findings' => $request->validated('chest_findings'),
                'impression' => $request->validated('impression'),
                'recommendation' => $request->validated('recommendation'),
                'remarks' => $request->validated('remarks'),
                'status' => $complete ? 'completed' : ($sendForVerification ? 'verifying' : 'awaiting_result'),
                'performed_at' => $appointment->xrayReport?->performed_at ?? now(),
                'result_available_at' => $complete ? now() : null,
                'verified_by' => $complete ? $request->user()->id : null,
                'verified_at' => $complete ? now() : null,
                'is_completed' => $complete,
                'sent_for_verification_by' => $sendForVerification ? $request->user()->id : $appointment->xrayReport?->sent_for_verification_by,
                'sent_for_verification_at' => $sendForVerification ? now() : $appointment->xrayReport?->sent_for_verification_at,
            ]);
            if ($complete || $sendForVerification) {
                app(\App\Services\OnsiteEventWorkflowService::class)->completeService($appointment, 'radtech', $request->user());
            }
            if ($sendForVerification) {
                app(\App\Services\OnsiteEventWorkflowService::class)->createDoctorTask($appointment, 'xray_verification');
            }
            app(\App\Services\EmployeeMedicalStatusResolver::class)->resolve($appointment->fresh());
            ClinicalFormAudit::create([
                'appointment_id' => $appointment->id, 'actor_id' => $request->user()->id,
                'form_type' => 'xray', 'action' => $complete ? 'result_verified' : ($sendForVerification ? 'sent_for_verification' : 'procedure_performed'),
                'changes' => $report->getChanges(), 'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(),
            ]);
        });

        $message = match ($request->validated('workflow_action')) {
            'complete' => 'Official X-ray result verified and sent for final evaluation.',
            'send_verification' => 'X-ray sent for verification.',
            default => 'X-ray marked as performed. The examination remains pending until the official result is available.',
        };

        return redirect()->route('radtech.appointments')->with('success', $message);
    }
}
