<?php

namespace App\Observers;

use App\Models\ClinicalFormAudit;
use App\Models\User;
use App\Services\WorkflowNotificationService;

class ClinicalActivityNotificationObserver
{
    public function created(ClinicalFormAudit $audit): void
    {
        if ($audit->action === 'updated' && empty($audit->changes)) {
            return;
        }
        if (! in_array($audit->form_type, ['physical_exam', 'laboratory', 'xray', 'drug_test', 'final_evaluation', 'medical_examination', 'vital_signs'], true)
            || ! in_array($audit->action, ['created', 'updated', 'finalized', 'result_verified', 'procedure_performed', 'sent_for_verification', 'verification_updated', 'report_released', 'urgent_override', 'recorded', 'recheck_requested'], true)) {
            return;
        }
        $service = app(WorkflowNotificationService::class);
        $type = 'clinical_'.$audit->form_type.'_'.$audit->action;
        $message = match ($audit->action) {
            'sent_for_verification' => 'A diagnostic procedure requires verification.',
            'verification_updated' => 'A diagnostic verification update was recorded.',
            'report_released' => 'A medical examination report was released.',
            'urgent_override' => 'An urgent clinical workflow override was recorded.',
            'recorded' => 'Vital signs were recorded for a consultation.',
            'recheck_requested' => 'A vital signs recheck was requested.',
            default => 'A clinical workflow step was completed or updated.',
        };
        $appointment = $audit->appointment;
        if (! $appointment) {
            return;
        }
        $laboratoryFinalized = $audit->form_type === 'laboratory'
            && ($audit->action === 'finalized' || ($audit->action === 'created' && $appointment->labResult?->isFinalized()));
        $service->admins($type, 'Clinical workflow update', $message, '/admin/appointments/'.$appointment->id);
        // Only staff already assigned to this visit receive clinical handoffs.
        $roles = match (true) {
            $audit->action === 'sent_for_verification', $audit->action === 'verification_updated' => ['drug_verification', 'medtech'],
            $audit->form_type === 'vital_signs' => ['doctor', 'final_evaluation'],
            $audit->form_type === 'physical_exam' => ['medtech', 'radtech', 'final_evaluation'],
            $laboratoryFinalized || ($audit->form_type === 'xray' && $audit->action === 'result_verified') => ['final_evaluation'],
            default => [],
        };
        $ids = $appointment->serviceQueues()->whereIn('service_role', $roles)
            ->whereIn('status', ['assigned', 'in_progress'])->pluck('assigned_staff_id');
        if (in_array('final_evaluation', $roles, true) && $appointment->doctor_id) {
            $ids->push($appointment->doctor_id);
        }
        if (in_array('drug_verification', $roles, true) && $appointment->labResult?->encoded_by) {
            $ids->push($appointment->labResult->encoded_by);
        }
        foreach (User::query()->whereIn('id', $ids->filter()->unique())->where('id', '!=', $audit->actor_id)->whereIn('role', ['doctor', 'medtech', 'radtech'])->get() as $staff) {
            $service->users([$staff], $type, 'Clinical workflow update', $message, '/'.$staff->role.'/appointments');
        }
        if ($audit->form_type === 'final_evaluation' && $audit->action === 'finalized') {
            $service->users(User::query()->where('role', 'receptionist')->where('id', '!=', $audit->actor_id)->get(), $type,
                'Medical report preparation', 'A finalized medical examination is ready for document preparation.', '/medical-documents');
        }
        if ($audit->form_type === 'vital_signs' && $audit->action === 'recheck_requested') {
            $service->users(User::query()->where('role', 'receptionist')->get(), $type,
                'Vital signs recheck requested', $message, '/receptionist/queue');
        }
    }
}
