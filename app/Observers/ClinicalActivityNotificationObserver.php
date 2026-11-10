<?php

namespace App\Observers;

use App\Models\ClinicalFormAudit;
use App\Models\User;
use App\Services\WorkflowNotificationService;
use App\Support\NotificationWording as W;

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
        $appointment = $audit->appointment;
        if (! $appointment) {
            return;
        }
        $form = match ($audit->form_type) {
            'physical_exam' => 'Physical examination',
            'laboratory' => 'Laboratory results',
            'xray' => 'X-ray results',
            'drug_test' => 'Drug test results',
            'final_evaluation' => 'Final evaluation',
            'medical_examination' => 'Medical examination',
            'vital_signs' => 'Vital signs',
        };
        $plural = in_array($audit->form_type, ['laboratory', 'xray', 'drug_test', 'vital_signs'], true);
        [$title, $description] = match ($audit->action) {
            'created' => [$form.' draft saved', $form.' draft was saved'],
            'updated' => [$form.' draft updated', $form.' draft was updated'],
            'finalized' => [$form.' finalized', $form.($plural ? ' were finalized' : ' was finalized')],
            'result_verified' => [$form.' verified', $form.($plural ? ' were verified' : ' was verified')],
            'procedure_performed' => [($audit->form_type === 'xray' ? 'X-ray' : $form).' procedure performed', ($audit->form_type === 'xray' ? 'X-ray' : $form).' procedure was performed'],
            'sent_for_verification' => [$form.' sent for verification', $form.($plural ? ' were sent' : ' was sent').' for verification'],
            'verification_updated' => [$form.' verification updated', $form.' verification was updated'],
            'report_released' => ['Medical report forwarded to reception', 'The medical report was forwarded to reception for collection preparation'],
            'urgent_override' => ['Clinical workflow override recorded', 'An urgent clinical workflow override was recorded'],
            'recorded' => [$form.' recorded', $form.($plural ? ' were recorded' : ' was recorded')],
            'recheck_requested' => ['Vital signs recheck requested', 'A vital signs recheck was requested'],
        };
        if ($audit->form_type === 'physical_exam' && in_array($audit->action, ['created', 'updated'], true)) {
            $verb = $audit->action === 'created' ? 'recorded' : 'updated';
            $title = 'Physical examination '.$verb;
            $description = 'Physical examination was '.$verb;
        }
        $laboratoryCreatedFinal = $audit->form_type === 'laboratory' && $audit->action === 'created' && $appointment->labResult?->isFinalized();
        if ($laboratoryCreatedFinal) {
            $title = 'Laboratory results finalized';
            $description = 'Laboratory results were finalized';
        }
        $message = $description.' for '.W::appointment($appointment).W::by($audit->actor).'.';
        $laboratoryFinalized = $audit->form_type === 'laboratory'
            && ($audit->action === 'finalized' || ($audit->action === 'created' && $appointment->labResult?->isFinalized()));
        $service->admins($type, $title, $message, '/admin/appointments/'.$appointment->id);
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
            $service->users([$staff], $type, $title, $message, '/'.$staff->role.'/appointments');
        }
        if ($audit->form_type === 'final_evaluation' && $audit->action === 'finalized') {
            $service->users(User::query()->where('role', 'receptionist')->where('id', '!=', $audit->actor_id)->get(), $type,
                'Final evaluation finalized', 'The final evaluation for '.W::appointment($appointment).' was finalized'.W::by($audit->actor).'; document preparation can begin.', '/medical-documents');
        }
        if ($audit->form_type === 'vital_signs' && $audit->action === 'recheck_requested') {
            $service->users(User::query()->where('role', 'receptionist')->get(), $type,
                'Vital signs recheck requested', $message, '/receptionist/queue');
        }
    }
}
