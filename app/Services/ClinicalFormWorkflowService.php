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
            if ($existing?->isFinalized() && $actor->role !== 'admin') {
                throw ValidationException::withMessages(['form' => 'This laboratory report has been finalized and is locked.']);
            }

            $sections = app(LaboratoryFormDefinition::class)->sectionsFor($appointment);
            $attributes = $this->laboratoryAttributes($data['results'] ?? [], $sections);
            $finalize = (bool) $data['finalize'];
            $attributes += [
                'medical_examination_id' => $medicalExamination->id,
                'encoded_by' => $actor->id,
                'remarks' => $data['remarks'] ?? null,
                'status' => $finalize ? 'finalized' : 'draft',
                'is_completed' => $finalize,
                'verified_by' => $finalize ? $actor->id : null,
                'finalized_at' => $finalize ? now() : null,
            ];

            $result = LabResult::updateOrCreate(['appointment_id' => $appointment->id], $attributes);
            foreach ($sections as $key => $definition) {
                if (! array_key_exists($key, $data['results'] ?? [])) {
                    continue;
                }

                $isDrugTest = $key === 'drug_test';
                $drugAction = $data['drug_workflow_action'] ?? 'complete';
                $initialDrugResult = $data['results'][$key];
                $reactiveDrugResult = $isDrugTest && collect($initialDrugResult)
                    ->contains(fn ($value) => strtolower((string) $value) === 'positive');
                if ($finalize && $isDrugTest && $reactiveDrugResult && $drugAction !== 'send_verification') {
                    throw ValidationException::withMessages(['drug_workflow_action' => 'A positive Drug Test must be sent for verification before it can be finalized.']);
                }
                $drugVerifying = $isDrugTest && $finalize && $drugAction === 'send_verification';
                $medicalExamination->diagnosticResults()->updateOrCreate(['service_key' => $key], [
                    'appointment_id' => $appointment->id,
                    'patient_id' => $appointment->user_id,
                    'company_id' => $appointment->company_id,
                    'batch_id' => $appointment->batch_id,
                    'status' => $finalize
                        ? ($drugVerifying ? 'verifying' : 'verified')
                        : 'in_progress',
                    'result_data' => $isDrugTest
                        ? ['initial_result' => $initialDrugResult, 'final_result' => $drugVerifying ? null : $initialDrugResult]
                        : $data['results'][$key],
                    'performed_by' => $actor->id,
                    'performed_at' => now(),
                    'encoded_by' => $actor->id,
                    'encoded_at' => now(),
                    'verified_by' => $finalize && ! $drugVerifying ? $actor->id : null,
                    'verified_at' => $finalize && ! $drugVerifying ? now() : null,
                    'sent_for_verification_by' => $drugVerifying ? $actor->id : null,
                    'sent_for_verification_at' => $drugVerifying ? now() : null,
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
            if ($finalize) {
                $appointment->update(['status' => $this->nextStatus($appointment)]);
                $medicalExamination->update(['status' => $medicalExamination->isReadyForFinalEvaluation()
                    ? 'ready_for_final_evaluation'
                    : 'awaiting_finalized_results']);
                app(OnsiteEventWorkflowService::class)->completeService($appointment, 'medtech', $actor);
                if (array_key_exists('drug_test', $data['results'] ?? []) && ($data['drug_workflow_action'] ?? 'complete') === 'send_verification') {
                    app(OnsiteEventWorkflowService::class)->createDoctorTask($appointment, 'drug_verification');
                }
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
