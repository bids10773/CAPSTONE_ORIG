<?php

namespace App\Services;

use App\Models\Appointment;

class EmployeeMedicalStatusResolver
{
    public function resolve(Appointment $appointment): string
    {
        $appointment->loadMissing('medicalExamination.diagnosticResults', 'medicalExamination.physicalExam', 'medicalExamination.laboratoryResult', 'medicalExamination.xrayReport');
        $examination = $appointment->medicalExamination;
        $drug = $examination?->diagnosticResults->firstWhere('service_key', 'drug_test');
        $drugVerifying = in_array($drug?->status, ['verifying', 'awaiting_official_result', 'official_result_received'], true);
        $xrayVerifying = in_array($appointment->xrayReport?->status, ['verifying', 'awaiting_result'], true);

        $status = match (true) {
            $drugVerifying && $xrayVerifying => 'verifying_drug_and_xray',
            $drugVerifying => 'verifying_drug_test',
            $xrayVerifying => 'verifying_xray',
            $examination?->isReadyForFinalEvaluation() => 'for_final_evaluation',
            default => $this->fallbackStatus($appointment),
        };

        if ($appointment->status !== 'completed' && $appointment->status !== 'absent' && $appointment->status !== $status) {
            $appointment->update(['status' => $status]);
        }
        if ($status === 'for_final_evaluation') {
            app(OnsiteEventWorkflowService::class)->refreshFinalEvaluationTask($appointment->fresh());
        }

        return $status;
    }

    private function fallbackStatus(Appointment $appointment): string
    {
        $examination = $appointment->medicalExamination;
        if ($appointment->isPePackage() && ! $examination?->physicalExam?->is_completed) {
            return 'arrived';
        }
        if (app(LaboratoryFormDefinition::class)->sectionsFor($appointment) !== [] && ! $examination?->laboratoryResult?->isFinalized()) {
            return 'for_diagnostics';
        }
        if ($appointment->requiresXray() && ! $examination?->xrayReport?->isVerified()) {
            return 'for_xray';
        }

        return $appointment->status;
    }

    public static function label(string $status): string
    {
        return match ($status) {
            'verifying_drug_test' => 'Verifying Drug Test Result',
            'verifying_xray' => 'Pending RadTech X-Ray Result',
            'verifying_drug_and_xray' => 'Verifying Drug and X-Ray Test Result',
            default => str($status)->replace('_', ' ')->title()->toString(),
        };
    }
}
