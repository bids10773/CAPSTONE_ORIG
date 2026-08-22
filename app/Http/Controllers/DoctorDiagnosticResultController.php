<?php

namespace App\Http\Controllers;

use App\Http\Requests\VerifyDiagnosticResultRequest;
use App\Http\Requests\VerifyXrayResultRequest;
use App\Models\Appointment;
use App\Models\ClinicalFormAudit;
use App\Services\MedicalExaminationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DoctorDiagnosticResultController extends Controller
{
    public function drugTest(VerifyDiagnosticResultRequest $request, Appointment $appointment, MedicalExaminationService $examinations): RedirectResponse
    {
        abort(403, 'Drug Test verification and finalization are assigned to the responsible MedTech.');
    }

    public function xray(VerifyXrayResultRequest $request, Appointment $appointment, MedicalExaminationService $examinations): RedirectResponse
    {
        $this->ensureAssignedTask($request->user(), $appointment, 'xray_verification');
        DB::transaction(function () use ($request, $appointment, $examinations): void {
            $examination = $examinations->forAppointment($appointment);
            abort_if($examination->finalized_at !== null, 423, 'This medical examination is locked.');
            $report = $appointment->xrayReport()->lockForUpdate()->firstOrFail();
            if ($report->performed_at === null || $report->status !== 'verifying') {
                throw ValidationException::withMessages(['result' => 'The X-ray must be sent for verification before doctor verification.']);
            }
            $before = $report->only(['status', 'findings', 'impression', 'verified_by', 'verified_at']);
            $report->update([
                'status' => $request->validated('result') === 'for_repeat' ? 'for_repeat' : 'completed',
                'findings' => $request->validated('findings'),
                'impression' => $request->validated('impression'),
                'remarks' => $request->validated('remarks'),
                'is_completed' => $request->validated('result') !== 'for_repeat',
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
                'result_available_at' => now(),
            ]);
            $this->refreshReadiness($examination);
            app(\App\Services\OnsiteEventWorkflowService::class)->completeService($appointment, 'xray_verification', $request->user());
            app(\App\Services\EmployeeMedicalStatusResolver::class)->resolve($appointment->fresh());
            $this->audit($appointment, $request->user()->id, 'xray', 'result_verified', ['before' => $before, 'after' => $report->fresh()->toArray()]);
        });

        return back()->with('success', 'Official X-ray interpretation verified.');
    }

    private function ensureAssignedTask($user, Appointment $appointment, string $task): void
    {
        if ($user->role === 'admin' || $appointment->bulk_appointment_id === null) {
            return;
        }
        abort_unless($appointment->serviceQueues()->where('service_role', $task)
            ->where('assigned_staff_id', $user->id)->whereIn('status', ['assigned', 'in_progress'])->exists(), 403);
    }

    private function refreshReadiness($examination): void
    {
        $examination->refresh()->load(['appointment', 'physicalExam', 'laboratoryResult', 'diagnosticResults', 'xrayReport']);
        $examination->update(['status' => $examination->isReadyForFinalEvaluation()
            ? 'ready_for_final_evaluation'
            : 'awaiting_finalized_results']);
    }

    private function audit(Appointment $appointment, int $actor, string $form, string $action, array $changes): void
    {
        ClinicalFormAudit::create([
            'appointment_id' => $appointment->id,
            'actor_id' => $actor,
            'form_type' => $form,
            'action' => $action,
            'changes' => $changes,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
