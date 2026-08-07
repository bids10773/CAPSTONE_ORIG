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
            if ($finalize) {
                $appointment->update(['status' => $this->nextStatus($appointment)]);
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
