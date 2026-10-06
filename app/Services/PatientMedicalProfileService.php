<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Collection;

class PatientMedicalProfileService
{
    public function __construct(private readonly LaboratoryFormDefinition $laboratoryForms) {}

    /**
     * Build a chronological medical profile without duplicating clinical data
     * into the demographic patient_profiles table.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function recordsFor(User $patient, bool $releasedOnly): Collection
    {
        return Appointment::query()
            ->where('user_id', $patient->id)
            ->with([
                'company:id,company_name',
                'physicalExam',
                'medicalExamination',
            ])
            ->latest('appointment_date')
            ->latest('id')
            ->get()
            ->filter(fn (Appointment $appointment): bool => $appointment->physicalExam !== null
                && (! $releasedOnly || $this->isReleasedToPatient($appointment)))
            ->take(1)
            ->map(fn (Appointment $appointment): array => $this->recordPayload($appointment, $releasedOnly))
            ->values();
    }

    /**
     * Return every clinical report and assigned staff member for admin review.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function adminReportsFor(User $patient): Collection
    {
        return Appointment::query()
            ->where('user_id', $patient->id)
            ->with([
                'user.patientProfile',
                'company:id,company_name',
                'doctor:id,first_name,middle_name,last_name,role',
                'physicalExam.doctor:id,first_name,middle_name,last_name,role',
                'medicalHistory',
                'labResult.encodedBy:id,first_name,middle_name,last_name,role',
                'labResult.verifiedBy:id,first_name,middle_name,last_name,role',
                'xrayReport.radiologist:id,first_name,middle_name,last_name,role',
                'xrayReport.verifiedBy:id,first_name,middle_name,last_name,role',
                'medicalExamination.examiningDoctor:id,first_name,middle_name,last_name,role',
                'medicalExamination.finalizedBy:id,first_name,middle_name,last_name,role',
                'serviceQueues.assignedStaff:id,first_name,middle_name,last_name,role',
            ])
            ->latest('appointment_date')
            ->latest('id')
            ->get()
            ->filter(fn (Appointment $appointment): bool => $appointment->physicalExam !== null
                || $appointment->medicalHistory !== null
                || $appointment->labResult !== null
                || $appointment->xrayReport !== null
                || $appointment->medicalExamination?->finalized_at !== null)
            ->map(fn (Appointment $appointment): array => $this->adminReportPayload($appointment))
            ->values();
    }

    private function isReleasedToPatient(Appointment $appointment): bool
    {
        return $appointment->status === 'completed'
            && $appointment->medicalExamination?->released_at !== null;
    }

    /** @return array<string, mixed> */
    private function recordPayload(Appointment $appointment, bool $releasedOnly): array
    {
        $physical = $appointment->physicalExam;

        return [
            'id' => $appointment->id,
            'examination_date' => $appointment->appointment_date?->toDateString(),
            'vital_signs' => $physical ? [
                'height_cm' => $physical->height,
                'weight_kg' => $physical->weight,
                'bmi' => $physical->bmi,
                'blood_pressure' => $physical->blood_pressure,
                'pulse_rate_bpm' => $physical->pulse_rate,
                'respiration_rate_rpm' => $physical->respiration_rate,
                'temperature_c' => $physical->temperature,
                'visual_acuity' => $physical->visual_acuity,
                'hearing' => $physical->hearing,
            ] : null,
        ];
    }

    /** @return array<string, mixed> */
    private function adminReportPayload(Appointment $appointment): array
    {
        $physical = $appointment->physicalExam;
        $laboratory = $appointment->labResult;
        $xray = $appointment->xrayReport;
        $evaluation = $appointment->medicalExamination;

        $staffAssignments = collect();
        $this->addStaff($staffAssignments, $appointment->doctor, 'Assigned doctor');
        $this->addStaff($staffAssignments, $physical?->doctor, 'Physical examiner');
        $this->addStaff($staffAssignments, $evaluation?->examiningDoctor, 'Medical examiner');
        $this->addStaff($staffAssignments, $evaluation?->finalizedBy, 'Final evaluator');
        $this->addStaff($staffAssignments, $laboratory?->encodedBy, 'Laboratory encoder');
        $this->addStaff($staffAssignments, $laboratory?->verifiedBy, 'Laboratory verifier');
        $this->addStaff($staffAssignments, $xray?->radiologist, 'Radiologic technologist');
        $this->addStaff($staffAssignments, $xray?->verifiedBy, 'X-ray verifier');

        foreach ($appointment->serviceQueues as $queue) {
            $this->addStaff(
                $staffAssignments,
                $queue->assignedStaff,
                str($queue->service_role)->replace('_', ' ')->title()->toString()
            );
        }

        return [
            'id' => $appointment->id,
            'reference_code' => $appointment->reference_code,
            'appointment_date' => $appointment->appointment_date?->toDateString(),
            'status' => $appointment->status,
            'type' => $appointment->type,
            'service_types' => $appointment->service_types ?? [],
            'company' => $appointment->company?->company_name ?? $appointment->company_name,
            'assigned_staff' => $staffAssignments->values()->all(),
            'reports' => [
                'physical_exam' => $physical ? [
                    'classification' => $evaluation?->medical_classification ?? $physical->classification,
                    'remarks' => $evaluation?->final_remarks ?? $physical->doctor_remarks ?? $physical->remarks,
                    'url' => route('clinical-forms.physical-exam.pdf', $appointment, false),
                ] : null,
                'laboratory' => $laboratory ? [
                    'status' => $laboratory->status,
                    'sections' => collect($this->laboratoryForms->sectionsFor($appointment))
                        ->filter(fn (array $definition): bool => filled($laboratory->{$definition['column']}))
                        ->pluck('label')
                        ->values()
                        ->all(),
                    'url' => route('clinical-forms.laboratory.pdf', $appointment, false),
                ] : null,
                'xray' => $xray ? [
                    'status' => $xray->status,
                    'impression' => $xray->impression,
                    'url' => route('clinical-forms.xray.pdf', $appointment, false),
                ] : null,
                'final_evaluation' => $evaluation?->finalized_at ? [
                    'classification' => $evaluation->medical_classification,
                    'fit_to_work' => $evaluation->fit_to_work,
                    'diagnosis' => $evaluation->final_diagnosis,
                    'recommendations' => $evaluation->recommendations,
                    'url' => route('clinical-forms.pe-section.pdf', [$appointment, 'final-evaluation'], false),
                ] : null,
            ],
            'appointment_url' => route('admin.appointments.show', $appointment, false),
        ];
    }

    private function addStaff(Collection $assignments, ?User $staff, string $responsibility): void
    {
        if ($staff === null) {
            return;
        }

        $existing = $assignments->get($staff->id, [
            'id' => $staff->id,
            'name' => $staff->name,
            'role' => $staff->role_label,
            'responsibilities' => [],
        ]);
        $existing['responsibilities'] = collect($existing['responsibilities'])
            ->push($responsibility)
            ->unique()
            ->values()
            ->all();
        $assignments->put($staff->id, $existing);
    }
}
