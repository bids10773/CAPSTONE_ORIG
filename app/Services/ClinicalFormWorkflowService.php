<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\ClinicalFormAudit;
use App\Models\LabResult;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ClinicalFormWorkflowService
{
    public function __construct(private MedicalExaminationService $examinations) {}

    public function saveLaboratory(Appointment $appointment, User $actor, array $data, Request $request): LabResult
    {
        return DB::transaction(function () use ($appointment, $actor, $data, $request): LabResult {
            $medicalExamination = $this->examinations->forAppointment($appointment);
            if ($medicalExamination->finalized_at && $actor->role !== 'admin') {
                throw ValidationException::withMessages(['form' => 'This medical examination has been finalized and is locked.']);
            }
            $existing = $appointment->labResult()->lockForUpdate()->first();
            $existingDrug = $medicalExamination->diagnosticResults()
                ->where('service_key', 'drug_test')->lockForUpdate()->first();
            $verificationUpdate = ($data['drug_workflow_action'] ?? null) === 'update_verification'
                && in_array($existingDrug?->status, ['verifying', 'awaiting_official_result', 'official_result_received'], true);
            $verificationFinalize = (bool) $data['finalize']
                && ($data['drug_workflow_action'] ?? null) === 'complete'
                && in_array($existingDrug?->status, ['verifying', 'awaiting_official_result', 'official_result_received'], true);
            $verificationStage = $verificationUpdate || $verificationFinalize;
            if ($existing?->isFinalized() && ! $verificationStage && $actor->role !== 'admin') {
                throw ValidationException::withMessages(['form' => 'This laboratory report has been finalized and is locked.']);
            }

            $sections = app(LaboratoryFormDefinition::class)->sectionsFor($appointment);
            $attributes = $this->laboratoryAttributes($data['results'] ?? [], $sections);
            $finalize = (bool) $data['finalize'];
            if ($verificationStage) {
                $attributes = array_intersect_key($attributes, ['drug_test_results' => true]);
            }
            $attributes += [
                'medical_examination_id' => $medicalExamination->id,
                // Preserve the original encoder while still auditing every update.
                'encoded_by' => $existing?->encoded_by ?? $actor->id,
                'remarks' => $data['remarks'] ?? null,
                'status' => $verificationFinalize ? 'finalized' : ($verificationStage ? $existing->status : ($finalize ? 'finalized' : 'draft')),
                'is_completed' => $verificationFinalize ? true : ($verificationStage ? $existing->is_completed : $finalize),
                'verified_by' => $verificationFinalize ? $actor->id : ($verificationStage ? $existing->verified_by : ($finalize ? $actor->id : null)),
                'finalized_at' => $verificationFinalize ? now() : ($verificationStage ? $existing->finalized_at : ($finalize ? now() : null)),
            ];

            $result = LabResult::updateOrCreate(['appointment_id' => $appointment->id], $attributes);
            foreach ($sections as $key => $definition) {
                if (! array_key_exists($key, $data['results'] ?? [])) {
                    continue;
                }
                if ($verificationStage && $key !== 'drug_test') {
                    continue;
                }

                $isDrugTest = $key === 'drug_test';
                $drugAction = $data['drug_workflow_action'] ?? 'complete';
                $initialDrugResult = $data['results'][$key];
                $reactiveDrugResult = $isDrugTest && collect($initialDrugResult)
                    ->contains(fn ($value) => strtolower((string) $value) === 'positive');
                if ($finalize && $isDrugTest && $reactiveDrugResult && $drugAction !== 'send_verification' && ! $verificationFinalize) {
                    throw ValidationException::withMessages(['drug_workflow_action' => 'A positive Drug Test must be sent for verification before it can be finalized.']);
                }
                $drugVerifying = $isDrugTest && $finalize && $drugAction === 'send_verification';
                $existingDiagnostic = $medicalExamination->diagnosticResults()
                    ->where('service_key', $key)
                    ->first();
                $medicalExamination->diagnosticResults()->updateOrCreate(['service_key' => $key], [
                    'appointment_id' => $appointment->id,
                    'patient_id' => $appointment->user_id,
                    'company_id' => $appointment->company_id,
                    'batch_id' => $appointment->batch_id,
                    'status' => $verificationUpdate && $isDrugTest
                        ? 'official_result_received'
                        : ($finalize
                        ? ($drugVerifying ? 'verifying' : 'verified')
                        : 'in_progress'),
                    'result_data' => $isDrugTest
                        ? ['initial_result' => $existingDiagnostic?->result_data['initial_result'] ?? $initialDrugResult, 'final_result' => $drugVerifying ? null : $initialDrugResult]
                        : $data['results'][$key],
                    'performed_by' => $existingDiagnostic?->performed_by ?? $actor->id,
                    'performed_at' => $existingDiagnostic?->performed_at ?? now(),
                    'encoded_by' => $existingDiagnostic?->encoded_by ?? $actor->id,
                    'encoded_at' => now(),
                    'verified_by' => $finalize && ! $drugVerifying ? $actor->id : $existingDiagnostic?->verified_by,
                    'verified_at' => $finalize && ! $drugVerifying ? now() : $existingDiagnostic?->verified_at,
                    'sent_for_verification_by' => $drugVerifying ? $actor->id : $existingDiagnostic?->sent_for_verification_by,
                    'sent_for_verification_at' => $drugVerifying ? now() : $existingDiagnostic?->sent_for_verification_at,
                ]);
                if ($drugVerifying) {
                    ClinicalFormAudit::create([
                        'appointment_id' => $appointment->id, 'actor_id' => $actor->id,
                        'form_type' => 'drug_test', 'action' => 'sent_for_verification',
                        'changes' => ['old_status' => $existing?->status, 'new_status' => 'verifying'],
                        'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(),
                    ]);
                }
            }
            if ($finalize && ! $verificationUpdate) {
                $appointment->update(['status' => $this->nextStatus($appointment)]);
                $medicalExamination->update(['status' => $medicalExamination->isReadyForFinalEvaluation()
                    ? 'ready_for_final_evaluation'
                    : 'awaiting_finalized_results']);
                if (($data['drug_workflow_action'] ?? 'complete') !== 'send_verification') {
                    app(OnsiteEventWorkflowService::class)->completeService($appointment, 'medtech', $actor);
                }
                if ($verificationFinalize) {
                    $appointment->serviceQueues()->where('service_role', 'drug_verification')
                        ->whereNotIn('status', ['completed', 'removed'])
                        ->update(['status' => 'removed', 'assigned_staff_id' => null]);
                }
                app(EmployeeMedicalStatusResolver::class)->resolve($appointment->fresh());
            } elseif ($verificationUpdate) {
                app(EmployeeMedicalStatusResolver::class)->resolve($appointment->fresh());
            }

            ClinicalFormAudit::create([
                'appointment_id' => $appointment->id,
                'actor_id' => $actor->id,
                'form_type' => 'laboratory',
                'action' => $existing ? ($finalize ? 'finalized' : 'updated') : 'created',
                'changes' => $result->getChanges(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return $result;
        });
    }

    public function auditDocumentAccess(Appointment $appointment, User $actor, string $formType, Request $request): void
    {
        ClinicalFormAudit::create([
            'appointment_id' => $appointment->id, 'actor_id' => $actor->id,
            'form_type' => $formType, 'action' => 'downloaded',
            'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(),
        ]);
    }

    private function laboratoryAttributes(array $results, array $sections): array
    {
        $attributes = [];
        foreach ($sections as $key => $section) {
            if (! array_key_exists($key, $results)) {
                continue;
            }
            $value = $results[$key];
            $attributes[$section['column']] = in_array($key, ['pregnancy', 'blood_type'], true)
                ? ($value[$section['fields'][0]['key']] ?? null)
                : $value;
        }

        return $attributes;
    }

    private function nextStatus(Appointment $appointment): string
    {
        return $appointment->requiresXray()
            ? 'for_xray'
            : 'for_final_evaluation';
    }
}
