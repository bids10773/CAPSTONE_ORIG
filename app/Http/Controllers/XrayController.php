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
        if (($appointment->medicalExamination?->finalized_at || $appointment->xrayReport?->finalized_at) && $request->user()->role !== 'admin') {
            throw ValidationException::withMessages(['form' => 'The X-ray report is finalized and locked.']);
        }

        DB::transaction(function () use ($request, $appointment, $examinations): void {
            $medicalExamination = $examinations->forAppointment($appointment);
            $complete = $request->validated('workflow_action') === 'complete';
            $report = XrayReport::updateOrCreate(['appointment_id' => $appointment->id], [
                'medical_examination_id' => $medicalExamination->id,
                'radiologist_id' => $request->user()->id,
                'findings' => $request->validated('chest_findings'),
                'impression' => $request->validated('impression'),
                'recommendation' => $request->validated('recommendation'),
                'remarks' => $request->validated('remarks'),
                'status' => $complete ? 'completed' : 'awaiting_result',
                'performed_at' => $appointment->xrayReport?->performed_at ?? now(),
                'result_available_at' => $complete ? now() : null,
                'verified_by' => $complete ? $request->user()->id : null,
                'verified_at' => $complete ? now() : null,
                'is_completed' => $complete,
            ]);
            $appointment->update(['status' => $complete ? 'for_final_evaluation' : 'awaiting_xray_result']);
            ClinicalFormAudit::create([
                'appointment_id' => $appointment->id, 'actor_id' => $request->user()->id,
                'form_type' => 'xray', 'action' => $complete ? 'result_verified' : 'procedure_performed',
                'changes' => $report->getChanges(), 'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(),
            ]);
        });

        return redirect()->route('radtech.appointments')->with('success',
            $request->validated('workflow_action') === 'complete'
                ? 'Official X-ray result verified and sent for final evaluation.'
                : 'X-ray marked as performed. The examination remains pending until the official result is available.');
    }
}
