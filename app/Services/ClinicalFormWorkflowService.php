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

            $attributes = $this->laboratoryAttributes($data['results'] ?? []);
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
            foreach (app(LaboratoryFormDefinition::class)->sectionsFor($appointment) as $key => $definition) {
                if (! array_key_exists($key, $data['results'] ?? [])) {
                    continue;
                }

                $isDrugTest = $key === 'drug_test';
                $medicalExamination->diagnosticResults()->updateOrCreate(['service_key' => $key], [
                    'appointment_id' => $appointment->id,
                    'patient_id' => $appointment->user_id,
                    'company_id' => $appointment->company_id,
                    'batch_id' => $appointment->batch_id,
                    'status' => $finalize
                        ? ($isDrugTest ? 'awaiting_official_result' : 'verified')
                        : 'in_progress',
                    'result_data' => $data['results'][$key],
                    'performed_by' => $actor->id,
                    'performed_at' => now(),
                    'encoded_by' => $isDrugTest ? null : $actor->id,
                    'encoded_at' => $isDrugTest ? null : now(),
                    'verified_by' => $finalize && ! $isDrugTest ? $actor->id : null,
                    'verified_at' => $finalize && ! $isDrugTest ? now() : null,
                ]);
            }
            if ($finalize) {
                $appointment->update(['status' => $this->nextStatus($appointment)]);
                $medicalExamination->update(['status' => $medicalExamination->isReadyForFinalEvaluation()
                    ? 'ready_for_final_evaluation'
                    : 'awaiting_finalized_results']);
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

    private function laboratoryAttributes(array $results): array
    {
        $attributes = [];
        foreach (app(LaboratoryFormDefinition::class)->sections() as $key => $section) {
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
