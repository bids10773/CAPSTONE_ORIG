<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinalizeMedicalEvaluationRequest;
use App\Http\Requests\SavePhysicalExamRequest;
use App\Models\Appointment;
use App\Models\ClinicalFormAudit;
use App\Models\MedicalHistory;
use App\Models\PhysicalExam;
use App\Notifications\MedicalReportReleased;
use App\Services\LaboratoryFormDefinition;
use App\Services\MedicalExaminationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PhysicalExamController extends Controller
{
    public function create(Appointment $appointment, MedicalExaminationService $examinations): Response
    {
        Gate::authorize('updatePhysicalExam', $appointment);
        app(\App\Services\OnsiteEventWorkflowService::class)->startService($appointment, 'doctor', request()->user());
        $medicalExamination = $examinations->forAppointment($appointment);
        $appointment->load(['user', 'company', 'medicalExamination', 'physicalExam', 'medicalHistory', 'patientProfile']);
        $medicalExamination->load(['appointment', 'physicalExam', 'laboratoryResult', 'diagnosticResults', 'xrayReport']);

        return Inertia::render('doctor/physical-exam-form', [
            'appointment' => $appointment,
            'physicalExam' => $appointment->physicalExam,
            'medicalExamination' => $medicalExamination,
            'childSummaries' => $medicalExamination->childSummaries(),
            'locked' => $appointment->medicalExamination?->finalized_at !== null && request()->user()->role !== 'admin',
            'submitUrl' => request()->user()->role === 'admin'
                ? route('admin.physical-exams.update', $appointment)
                : route('doctor.physical-exams.store', $appointment),
        ]);
    }

    public function store(SavePhysicalExamRequest $request, Appointment $appointment, LaboratoryFormDefinition $definitions, MedicalExaminationService $examinations): RedirectResponse
    {
        $existing = $appointment->physicalExam;
        if (($appointment->medicalExamination?->finalized_at || $existing?->finalized_at) && $request->user()->role !== 'admin') {
            throw ValidationException::withMessages(['form' => 'The physical examination is finalized and locked.']);
        }

        DB::transaction(function () use ($request, $appointment, $definitions, $examinations): void {
            $data = $request->validated();
            $medicalExamination = $examinations->forAppointment($appointment);
            if ($medicalExamination->finalized_at) {
                throw ValidationException::withMessages(['medical_class' => 'This medical examination has already been finalized.']);
            }
            $findings = [];
            foreach ($request->bodyParts() as $field) {
                $findings[$field] = $data["{$field}_status"] === 'normal' ? null : $data[$field];
            }

            $exam = PhysicalExam::updateOrCreate(['appointment_id' => $appointment->id], [
                'medical_examination_id' => $medicalExamination->id,
                'doctor_id' => $request->user()->id,
                ...$request->safe()->only([
                    'height', 'weight', 'blood_pressure', 'pulse_rate', 'respiration_rate',
                    'temperature', 'visual_acuity', 'hearing', 'remarks',
                ]),
                ...$findings,
                'classification' => 'Pending',
                'is_completed' => true,
            ]);
            MedicalHistory::updateOrCreate(['appointment_id' => $appointment->id], [
                'medical_examination_id' => $medicalExamination->id,
                ...$request->safe()->only([
                    'present_illness', 'past_medical_history', 'operations_accidents', 'family_history',
                    'allergies', 'personal_social_history', 'ob_menstrual_history',
                ]),
            ]);
            $medicalExamination->update(['examining_doctor_id' => $request->user()->id]);

            $next = $definitions->sectionsFor($appointment) !== []
                ? 'for_diagnostics'
                : ($appointment->requiresXray() ? 'for_xray' : 'for_final_evaluation');
            $appointment->update(['status' => $next]);
            app(\App\Services\OnsiteEventWorkflowService::class)->completeService($appointment, 'doctor', $request->user());
            app(\App\Services\OnsiteEventWorkflowService::class)->refreshFinalEvaluationTask($appointment->fresh());
            $this->audit($request, $appointment, 'physical_exam', $exam->wasRecentlyCreated ? 'created' : 'updated', $exam->getChanges());
        });

        $destination = $appointment->bulk_appointment_id !== null
            ? route('doctor.onsite-events.show', $appointment->bulk_appointment_id)
            : route('doctor.dashboard');

        return redirect()->to($destination)->with('success', 'Physical examination saved and forwarded to the next required stage.');
    }

    public function final(Appointment $appointment, MedicalExaminationService $examinations): Response
    {
        $canFinalize = Gate::allows('finalizeMedicalEvaluation', $appointment);
        $canVerify = Gate::allows('verifyDiagnosticResults', $appointment);
        abort_unless($canFinalize || $canVerify, 403);
        $verificationTask = $appointment->serviceQueues()->where('assigned_staff_id', request()->user()->id)
            ->where('service_role', 'drug_verification')
            ->whereIn('status', ['assigned', 'in_progress'])->value('service_role');
        app(\App\Services\OnsiteEventWorkflowService::class)->startService(
            $appointment,
            $canFinalize ? 'final_evaluation' : ($verificationTask ?: 'drug_verification'),
            request()->user()
        );
        $medicalExamination = $examinations->forAppointment($appointment);
        $appointment->load(['user', 'company', 'patientProfile', 'physicalExam', 'labResult.encodedBy', 'xrayReport', 'medicalHistory']);
        $medicalExamination->load(['appointment', 'physicalExam', 'laboratoryResult', 'diagnosticResults', 'xrayReport']);

        return Inertia::render('doctor/final-evaluation', [
            'appointment' => $appointment,
            'selectedServices' => $appointment->service_types ?? [],
            'medicalExamination' => $medicalExamination,
            'childSummaries' => $medicalExamination->childSummaries(),
            'readyForFinalEvaluation' => $medicalExamination->isReadyForFinalEvaluation(),
            'canFinalize' => $canFinalize,
        ]);
    }

    public function finalStore(FinalizeMedicalEvaluationRequest $request, Appointment $appointment, MedicalExaminationService $examinations): RedirectResponse
    {
        DB::transaction(function () use ($request, $appointment, $examinations): void {
            $requested = collect($appointment->service_types ?? []);
            $medicalExamination = $examinations->forAppointment($appointment);
            $medicalExamination->load(['appointment', 'physicalExam', 'laboratoryResult', 'diagnosticResults', 'xrayReport']);
            if (! $medicalExamination->isReadyForFinalEvaluation()) {
                throw ValidationException::withMessages(['medical_class' => 'Complete every selected examination before final evaluation.']);
            }
            $exam = $appointment->physicalExam()->lockForUpdate()->first();
            if ($requested->contains('PE') && ! $exam) {
                throw ValidationException::withMessages(['medical_class' => 'Complete the physical examination before final evaluation.']);
            }

            if (app(LaboratoryFormDefinition::class)->sectionsFor($appointment) !== []
                && ! $appointment->labResult?->isFinalized()) {
                throw ValidationException::withMessages(['medical_class' => 'Finalize all requested laboratory results first.']);
            }
            if ($appointment->requiresXray() && ! $appointment->xrayReport?->isVerified()) {
                throw ValidationException::withMessages(['medical_class' => 'Complete the requested X-ray report first.']);
            }

            $classification = match ($request->validated('medical_class')) {
                'A' => 'Class A', 'B' => 'Class B', 'C' => 'Class C',
                'unfit' => 'Unfit', default => 'Pending',
            };
            $medicalExamination->update([
                'examining_doctor_id' => $request->user()->id,
                'medical_classification' => $classification,
                'fit_to_work' => in_array($classification, ['Class A', 'Class B'], true),
                'final_diagnosis' => $request->validated('final_diagnosis'),
                'final_remarks' => $request->validated('final_remarks'),
                'recommendations' => $request->validated('recommendations'),
                'status' => 'finalized',
                'finalized_by' => $request->user()->id,
                'finalized_at' => now(),
            ]);
            $appointment->update(['status' => 'completed']);
            app(\App\Services\OnsiteEventWorkflowService::class)->completeService($appointment, 'final_evaluation', $request->user());
            $this->audit($request, $appointment, 'final_evaluation', 'finalized', ['classification' => $classification]);
        });

        $destination = $appointment->bulk_appointment_id !== null
            ? route('doctor.onsite-events.show', $appointment->bulk_appointment_id)
            : route('doctor.dashboard');

        return redirect()->to($destination)->with('success', 'Final medical evaluation completed. All clinical forms are now locked.');
    }

    public function release(Request $request, Appointment $appointment): RedirectResponse
    {
        Gate::authorize('releaseMedicalReport', $appointment);

        DB::transaction(function () use ($request, $appointment): void {
            $examination = $appointment->medicalExamination()->lockForUpdate()->firstOrFail();
            if ($examination->released_at !== null) {
                throw ValidationException::withMessages(['report' => 'This report has already been released.']);
            }

            $examination->update([
                'status' => 'report_released',
                'released_by' => $request->user()->id,
                'released_at' => now(),
            ]);
            $this->audit($request, $appointment, 'medical_examination', 'report_released', [
                'released_by' => $request->user()->id,
                'released_at' => $examination->released_at?->toIso8601String(),
            ]);

            DB::afterCommit(fn () => $appointment->user?->notify(new MedicalReportReleased));
        });

        return back()->with('success', 'Final PE report released to the patient.');
    }

    private function audit(Request $request, Appointment $appointment, string $form, string $action, array $changes): void
    {
        ClinicalFormAudit::create([
            'appointment_id' => $appointment->id, 'actor_id' => $request->user()->id,
            'form_type' => $form, 'action' => $action, 'changes' => $changes,
            'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(),
        ]);
    }
}
