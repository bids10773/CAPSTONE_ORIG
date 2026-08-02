<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinalizeMedicalEvaluationRequest;
use App\Http\Requests\SavePhysicalExamRequest;
use App\Models\Appointment;
use App\Models\ClinicalFormAudit;
use App\Models\MedicalHistory;
use App\Models\PhysicalExam;
use App\Services\LaboratoryFormDefinition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PhysicalExamController extends Controller
{
    public function create(Appointment $appointment): Response
    {
        Gate::authorize('updatePhysicalExam', $appointment);
        $appointment->load(['user', 'company', 'physicalExam', 'medicalHistory', 'patientProfile']);

        return Inertia::render('doctor/physical-exam-form', [
            'appointment' => $appointment,
            'physicalExam' => $appointment->physicalExam,
            'locked' => $appointment->physicalExam?->finalized_at !== null && request()->user()->role !== 'admin',
            'submitUrl' => request()->user()->role === 'admin'
                ? route('admin.physical-exams.update', $appointment)
                : route('doctor.physical-exams.store', $appointment),
        ]);
    }

    public function store(SavePhysicalExamRequest $request, Appointment $appointment, LaboratoryFormDefinition $definitions): RedirectResponse
    {
        $existing = $appointment->physicalExam;
        if ($existing?->finalized_at && $request->user()->role !== 'admin') {
            throw ValidationException::withMessages(['form' => 'The physical examination is finalized and locked.']);
        }

        DB::transaction(function () use ($request, $appointment, $definitions): void {
            $data = $request->validated();
            $findings = [];
            foreach ($request->bodyParts() as $field) {
                $findings[$field] = $data["{$field}_status"] === 'normal' ? null : $data[$field];
            }

            $exam = PhysicalExam::updateOrCreate(['appointment_id' => $appointment->id], [
                'doctor_id' => $request->user()->id,
                ...$request->safe()->only(['height', 'weight', 'blood_pressure', 'pulse_rate', 'temperature', 'remarks']),
                ...$findings,
                'classification' => 'Pending',
            ]);
            MedicalHistory::updateOrCreate(['appointment_id' => $appointment->id], $request->safe()->only([
                'present_illness', 'past_medical_history', 'operations_accidents', 'family_history',
                'allergies', 'personal_social_history', 'ob_menstrual_history',
            ]));

            $next = $definitions->sectionsFor($appointment) !== []
                ? 'for_diagnostics'
                : (in_array('X-Ray', $appointment->service_types ?? [], true) ? 'for_xray' : 'for_final_evaluation');
            $appointment->update(['status' => $next]);
            $this->audit($request, $appointment, 'physical_exam', $exam->wasRecentlyCreated ? 'created' : 'updated', $exam->getChanges());
        });

        return redirect()->route('doctor.dashboard')->with('success', 'Physical examination saved and forwarded to the next required stage.');
    }

    public function final(Appointment $appointment): Response
    {
        Gate::authorize('finalizeMedicalEvaluation', $appointment);
        $appointment->load(['user', 'company', 'patientProfile', 'physicalExam', 'labResult.encodedBy', 'xrayReport', 'medicalHistory']);

        return Inertia::render('doctor/final-evaluation', [
            'appointment' => $appointment,
            'selectedServices' => $appointment->service_types ?? [],
        ]);
    }

    public function finalStore(FinalizeMedicalEvaluationRequest $request, Appointment $appointment): RedirectResponse
    {
        DB::transaction(function () use ($request, $appointment): void {
            $requested = collect($appointment->service_types ?? []);
            $exam = $appointment->physicalExam()->lockForUpdate()->first();
            if ($requested->contains('PE') && ! $exam) {
                throw ValidationException::withMessages(['medical_class' => 'Complete the physical examination before final evaluation.']);
            }

            if ($requested->intersect(['CBC', 'Urinalysis', 'Fecalysis', 'Drug Test', 'Hepatitis', 'Pregnancy Test', 'FBS', 'Blood Chemistry', 'Blood Typing'])->isNotEmpty()
                && ! $appointment->labResult?->isFinalized()) {
                throw ValidationException::withMessages(['medical_class' => 'Finalize all requested laboratory results first.']);
            }
            if ($requested->contains('X-Ray') && ! $appointment->xrayReport?->is_completed) {
                throw ValidationException::withMessages(['medical_class' => 'Complete the requested X-ray report first.']);
            }

            $classification = match ($request->validated('medical_class')) {
                'A' => 'Class A', 'B' => 'Class B', 'C' => 'Class C',
                'unfit' => 'Unfit', default => 'Pending',
            };
            $exam ??= new PhysicalExam;
            $exam->fill([
                'appointment_id' => $appointment->id,
                'doctor_id' => $request->user()->id,
                'classification' => $classification, 'doctor_remarks' => $request->validated('final_remarks'),
                'is_completed' => true, 'finalized_by' => $request->user()->id, 'finalized_at' => now(),
            ]);
            $exam->save();
            $appointment->labResult?->update(['status' => 'finalized', 'is_completed' => true]);
            $appointment->xrayReport?->update(['finalized_by' => $request->user()->id, 'finalized_at' => now()]);
            $appointment->update(['status' => 'completed']);
            $this->audit($request, $appointment, 'final_evaluation', 'finalized', ['classification' => $classification]);
        });

        return redirect()->route('doctor.dashboard')->with('success', 'Final medical evaluation completed. All clinical forms are now locked.');
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
