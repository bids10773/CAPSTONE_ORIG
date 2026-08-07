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
        DB::transaction(function () use ($request, $appointment, $examinations): void {
            $examination = $examinations->forAppointment($appointment);
            abort_if($examination->finalized_at !== null, 423, 'This medical examination is locked.');
            $result = $examination->diagnosticResults()->lockForUpdate()->where('service_key', 'drug_test')->firstOrFail();
            if (! in_array($result->status, ['awaiting_official_result', 'official_result_received'], true)) {
                throw ValidationException::withMessages(['result' => 'An official Drug Test result must be received before doctor verification.']);
            }

            $before = $result->only(['status', 'result_data', 'remarks', 'verified_by', 'verified_at']);
            $path = $request->file('supporting_document')?->store('medical-results/drug-tests', 'local');
            $result->update([
                'status' => 'verified',
                'result_data' => ['summary' => $request->validated('result')],
                'remarks' => $request->validated('remarks'),
                'official_reference_number' => $request->validated('official_reference_number'),
                'official_result_date' => $request->validated('official_result_date'),
                'supporting_document_path' => $path ?? $result->supporting_document_path,
                'encoded_by' => $request->user()->id,
                'encoded_at' => now(),
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
            ]);
            $this->refreshReadiness($examination);
            $this->audit($appointment, $request->user()->id, 'drug_test', 'result_verified', ['before' => $before, 'after' => $result->fresh()->toArray()]);
        });

        return back()->with('success', 'Official Drug Test result verified.');
    }

    public function xray(VerifyXrayResultRequest $request, Appointment $appointment, MedicalExaminationService $examinations): RedirectResponse
    {
        DB::transaction(function () use ($request, $appointment, $examinations): void {
            $examination = $examinations->forAppointment($appointment);
            abort_if($examination->finalized_at !== null, 423, 'This medical examination is locked.');
            $report = $appointment->xrayReport()->lockForUpdate()->firstOrFail();
            if ($report->performed_at === null || $report->result_available_at === null) {
                throw ValidationException::withMessages(['result' => 'Official X-ray findings must be available before doctor verification.']);
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
            ]);
            $this->refreshReadiness($examination);
            $this->audit($appointment, $request->user()->id, 'xray', 'result_verified', ['before' => $before, 'after' => $report->fresh()->toArray()]);
        });

        return back()->with('success', 'Official X-ray interpretation verified.');
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
