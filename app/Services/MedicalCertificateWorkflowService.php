<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\MedicalCertificate;
use App\Models\MedicalCertificateAudit;
use App\Models\User;
use App\Support\ClinicHours;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MedicalCertificateWorkflowService
{
    public function generateForFinalizedAppointment(Appointment $appointment, User $actor, Request $request): ?MedicalCertificate
    {
        return DB::transaction(function () use ($appointment, $actor, $request): ?MedicalCertificate {
            $appointment = Appointment::query()->lockForUpdate()->findOrFail($appointment->id);
            $appointment->load(['medicalExamination', 'user.patientProfile']);

            if ($appointment->examination_purpose !== 'medical_clearance'
                || $appointment->status !== 'completed'
                || ! $appointment->medicalExamination?->finalized_at) {
                return null;
            }

            $existing = MedicalCertificate::query()->where('appointment_id', $appointment->id)->first();
            if ($existing) {
                return $existing;
            }

            $sex = $appointment->user->patientProfile?->sex ?: $appointment->user->sex;

            return $this->createDraft($actor, [
                'patient_id' => $appointment->user_id,
                'appointment_id' => $appointment->id,
                'attending_physician_id' => $actor->id,
                'salutation' => match (strtolower((string) $sex)) {
                    'female' => 'Ms.',
                    'male' => 'Mr.',
                    default => '',
                },
                'consultation_date' => $appointment->appointment_date->toDateString(),
            ], $request);
        });
    }

    public function createDraft(User $actor, array $data, Request $request): MedicalCertificate
    {
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            try {
                return DB::transaction(function () use ($actor, $data, $request): MedicalCertificate {
                    [$patient, $physician, $appointment] = $this->resolveParticipants($actor, $data);
                    $year = (int) ClinicHours::now()->format('Y');
                    $lastSequence = MedicalCertificate::query()
                        ->where('sequence_year', $year)
                        ->lockForUpdate()
                        ->max('sequence_number');
                    $sequence = ((int) $lastSequence) + 1;

                    $certificate = MedicalCertificate::create([
                        ...$this->certificateAttributes($data, $patient, $physician, $appointment),
                        'certificate_number' => sprintf('MC-%d-%06d', $year, $sequence),
                        'sequence_year' => $year,
                        'sequence_number' => $sequence,
                        'created_by' => $actor->id,
                        'updated_by' => $actor->id,
                        'status' => 'draft',
                    ]);

                    $this->audit($certificate, $actor, 'created', null, 'draft', $this->changes($certificate), $request);

                    return $certificate->fresh($this->defaultRelations());
                });
            } catch (QueryException $exception) {
                if ($attempt === 5 || ! $this->isSequenceConflict($exception)) {
                    throw $exception;
                }
            }
        }

        throw ValidationException::withMessages([
            'certificate_number' => 'A certificate number could not be reserved. Please try again.',
        ]);
    }

    public function updateDraft(
        MedicalCertificate $medicalCertificate,
        User $actor,
        array $data,
        Request $request,
    ): MedicalCertificate {
        return DB::transaction(function () use ($medicalCertificate, $actor, $data, $request): MedicalCertificate {
            $certificate = MedicalCertificate::query()->lockForUpdate()->findOrFail($medicalCertificate->id);
            $this->ensureStatus($certificate, ['draft', 'changes_requested'], 'Only draft certificates or certificates returned for correction may be edited.');
            [$patient, $physician, $appointment] = $this->resolveParticipants($actor, $data);

            $certificate->fill([
                ...$this->certificateAttributes($data, $patient, $physician, $appointment),
                'updated_by' => $actor->id,
            ])->save();

            $this->audit(
                $certificate,
                $actor,
                'updated',
                $certificate->status,
                $certificate->status,
                $this->changes($certificate),
                $request,
            );

            return $certificate->fresh($this->defaultRelations());
        });
    }

    public function submitForApproval(MedicalCertificate $medicalCertificate, User $actor, Request $request): MedicalCertificate
    {
        return DB::transaction(function () use ($medicalCertificate, $actor, $request): MedicalCertificate {
            $certificate = MedicalCertificate::query()->lockForUpdate()->findOrFail($medicalCertificate->id);
            $this->ensureStatus($certificate, ['draft', 'changes_requested'], 'This certificate cannot be submitted in its current status.');
            $this->ensureComplete($certificate);
            $oldStatus = $certificate->status;

            $certificate->update([
                'status' => 'pending_approval',
                'submitted_at' => now(),
                'updated_by' => $actor->id,
                'approval_notes' => null,
                'change_request_reason' => null,
                'approved_by' => null,
                'approved_at' => null,
            ]);

            $this->audit($certificate, $actor, 'submitted', $oldStatus, 'pending_approval', [], $request);

            return $certificate->fresh($this->defaultRelations());
        });
    }

    public function approve(
        MedicalCertificate $medicalCertificate,
        User $actor,
        ?string $notes,
        Request $request,
    ): MedicalCertificate {
        return DB::transaction(function () use ($medicalCertificate, $actor, $notes, $request): MedicalCertificate {
            $certificate = MedicalCertificate::query()->lockForUpdate()->findOrFail($medicalCertificate->id);
            $this->ensureAssignedPhysician($certificate, $actor);
            $this->ensureStatus($certificate, ['pending_approval'], 'Only a certificate pending approval may be approved.');
            $this->ensureVerifiedPhysician($actor);
            $this->ensureComplete($certificate);

            $attributes = [
                'status' => 'approved',
                'approval_notes' => filled($notes) ? trim($notes) : null,
                'change_request_reason' => null,
                'approved_by' => $actor->id,
                'approved_at' => now(),
                'updated_by' => $actor->id,
            ];
            if (filled($actor->license_no)) {
                $attributes['physician_license_no'] = $actor->license_no;
            }
            $certificate->update($attributes);

            $this->audit($certificate, $actor, 'approved', 'pending_approval', 'approved', [
                'approval_notes' => $certificate->approval_notes,
            ], $request);

            return $certificate->fresh($this->defaultRelations());
        });
    }

    public function requestChanges(
        MedicalCertificate $medicalCertificate,
        User $actor,
        string $reason,
        Request $request,
    ): MedicalCertificate {
        return DB::transaction(function () use ($medicalCertificate, $actor, $reason, $request): MedicalCertificate {
            $certificate = MedicalCertificate::query()->lockForUpdate()->findOrFail($medicalCertificate->id);
            $this->ensureAssignedPhysician($certificate, $actor);
            $this->ensureStatus($certificate, ['pending_approval'], 'Only a certificate pending approval may be returned for correction.');

            $certificate->update([
                'status' => 'changes_requested',
                'change_request_reason' => trim($reason),
                'approval_notes' => null,
                'updated_by' => $actor->id,
            ]);

            $this->audit($certificate, $actor, 'changes_requested', 'pending_approval', 'changes_requested', [
                'reason' => $certificate->change_request_reason,
            ], $request);

            return $certificate->fresh($this->defaultRelations());
        });
    }

    public function issue(
        MedicalCertificate $medicalCertificate,
        User $actor,
        ?string $dateIssued,
        Request $request,
    ): MedicalCertificate {
        return DB::transaction(function () use ($medicalCertificate, $actor, $dateIssued, $request): MedicalCertificate {
            $certificate = MedicalCertificate::query()->lockForUpdate()->findOrFail($medicalCertificate->id);
            $this->ensureStatus($certificate, ['approved'], 'Only an approved certificate may be issued.');
            $this->ensureComplete($certificate);

            $clinicToday = ClinicHours::now()->startOfDay();
            $issueDate = $dateIssued
                ? Date::parse($dateIssued, ClinicHours::timezone())->startOfDay()
                : ($certificate->date_issued?->startOfDay() ?? $clinicToday);
            $issueDateString = $issueDate->toDateString();

            if ($issueDateString > $clinicToday->toDateString()
                || $issueDateString < $certificate->consultation_date->toDateString()) {
                throw ValidationException::withMessages([
                    'date_issued' => 'The issue date must be between the consultation date and today.',
                ]);
            }

            $certificate->update([
                'status' => 'issued',
                'date_issued' => $issueDateString,
                'issued_by' => $actor->id,
                'issued_at' => now(),
                'updated_by' => $actor->id,
            ]);

            $this->audit($certificate, $actor, 'issued', 'approved', 'issued', [
                'date_issued' => $certificate->date_issued?->toDateString(),
            ], $request);

            return $certificate->fresh($this->defaultRelations());
        });
    }

    public function void(
        MedicalCertificate $medicalCertificate,
        User $actor,
        string $reason,
        Request $request,
    ): MedicalCertificate {
        return DB::transaction(function () use ($medicalCertificate, $actor, $reason, $request): MedicalCertificate {
            $certificate = MedicalCertificate::query()->lockForUpdate()->findOrFail($medicalCertificate->id);
            $this->ensureStatus($certificate, ['issued'], 'Only an issued certificate may be voided.');

            $certificate->update([
                'status' => 'void',
                'void_reason' => trim($reason),
                'voided_by' => $actor->id,
                'voided_at' => now(),
                'updated_by' => $actor->id,
            ]);

            $this->audit($certificate, $actor, 'voided', 'issued', 'void', [
                'reason' => $certificate->void_reason,
            ], $request);

            return $certificate->fresh($this->defaultRelations());
        });
    }

    public function auditDocumentAccess(
        MedicalCertificate $medicalCertificate,
        User $actor,
        string $action,
        Request $request,
    ): void {
        $this->audit(
            $medicalCertificate,
            $actor,
            $action,
            $medicalCertificate->status,
            $medicalCertificate->status,
            [],
            $request,
        );
    }

    private function resolveParticipants(User $actor, array $data): array
    {
        $patient = User::query()
            ->with('patientProfile')
            ->whereKey($data['patient_id'])
            ->where('role', 'patient')
            ->first();
        $physician = User::query()
            ->whereKey($data['attending_physician_id'])
            ->where('role', 'doctor')
            ->where('is_active', true)
            ->first();

        if (! $patient) {
            throw ValidationException::withMessages(['patient_id' => 'Select a valid patient record.']);
        }
        if (! $physician) {
            throw ValidationException::withMessages(['attending_physician_id' => 'Select an active physician account.']);
        }
        if ($actor->role === 'doctor' && $physician->id !== $actor->id) {
            throw ValidationException::withMessages([
                'attending_physician_id' => 'Doctors may only prepare certificates assigned to themselves.',
            ]);
        }
        if ($actor->role === 'doctor' && ! $this->doctorHasPatientAccess($actor, $patient)) {
            throw ValidationException::withMessages([
                'patient_id' => 'You may only prepare a certificate for a patient assigned to you.',
            ]);
        }

        $appointment = null;
        if (! empty($data['appointment_id'])) {
            $appointment = Appointment::query()
                ->with(['medicalHistory', 'medicalExamination'])
                ->whereKey($data['appointment_id'])
                ->where('user_id', $patient->id)
                ->first();

            if (! $appointment) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'The selected consultation does not belong to this patient.',
                ]);
            }
            if ($actor->role === 'doctor' && ! $this->doctorHasAppointmentAccess($actor, $appointment)) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'The selected consultation is not assigned to you.',
                ]);
            }
        }

        return [$patient, $physician, $appointment];
    }

    private function doctorHasPatientAccess(User $doctor, User $patient): bool
    {
        return $patient->appointments()
            ->where(fn ($query) => $query
                ->where('doctor_id', $doctor->id)
                ->orWhereHas('medicalExamination', fn ($exam) => $exam
                    ->where('examining_doctor_id', $doctor->id)
                    ->orWhere('finalized_by', $doctor->id))
                ->orWhereHas('serviceQueues', fn ($queue) => $queue
                    ->where('assigned_staff_id', $doctor->id)
                    ->whereIn('service_role', ['doctor', 'drug_verification', 'final_evaluation'])))
            ->exists();
    }

    private function doctorHasAppointmentAccess(User $doctor, Appointment $appointment): bool
    {
        return $appointment->doctor_id === $doctor->id
            || $appointment->medicalExamination?->examining_doctor_id === $doctor->id
            || $appointment->medicalExamination?->finalized_by === $doctor->id
            || $appointment->serviceQueues()
                ->where('assigned_staff_id', $doctor->id)
                ->whereIn('service_role', ['doctor', 'drug_verification', 'final_evaluation'])
                ->exists();
    }

    private function certificateAttributes(
        array $data,
        User $patient,
        User $physician,
        ?Appointment $appointment,
    ): array {
        $consultationDate = Date::parse($data['consultation_date'], ClinicHours::timezone())->startOfDay();
        $birthdate = $patient->patientProfile?->birthdate?->startOfDay();

        if ($birthdate?->gt($consultationDate)) {
            throw ValidationException::withMessages([
                'consultation_date' => 'The consultation date cannot be before the patient birthdate.',
            ]);
        }

        $calculatedAge = $birthdate ? (int) $birthdate->diffInYears($consultationDate) : null;
        $patientSex = $patient->patientProfile?->sex
            ?: $patient->sex
            ?: ($data['patient_sex'] ?? null);
        $civilStatus = $patient->patientProfile?->civil_status
            ?: ($data['patient_civil_status'] ?? null);

        return [
            'patient_id' => $patient->id,
            'appointment_id' => $appointment?->id,
            'attending_physician_id' => $physician->id,
            'salutation' => filled($data['salutation']) ? Str::finish(rtrim($data['salutation'], '.'), '.') : '',
            'patient_name' => $patient->name,
            'patient_reference_code' => $patient->patient_reference_code,
            'patient_age' => $data['patient_age'] ?? $calculatedAge,
            'patient_sex' => filled($data['patient_sex'] ?? null)
                ? Str::title((string) $data['patient_sex'])
                : (filled($patientSex) ? Str::title((string) $patientSex) : null),
            'patient_civil_status' => filled($data['patient_civil_status'] ?? null)
                ? Str::title((string) $data['patient_civil_status'])
                : (filled($civilStatus) ? Str::title((string) $civilStatus) : null),
            'consultation_date' => $consultationDate->toDateString(),
            'reason_for_consultation' => $this->inputOrRecordValue(
                $data,
                'reason_for_consultation',
                $appointment?->medicalHistory?->present_illness ?? $appointment?->notes,
            ),
            'clinical_impression' => $this->inputOrRecordValue(
                $data,
                'clinical_impression',
                $appointment?->medicalExamination?->final_diagnosis,
            ),
            'recommendation' => $this->inputOrRecordValue(
                $data,
                'recommendation',
                $appointment?->medicalExamination?->recommendations,
            ),
            'rest_start_date' => $data['rest_start_date'] ?? null,
            'rest_end_date' => $data['rest_end_date'] ?? null,
            'date_issued' => $data['date_issued'] ?? null,
            'physician_name' => $physician->name,
            'physician_license_no' => $physician->license_no ?: ($data['physician_license_no'] ?? null),
        ];
    }

    private function inputOrRecordValue(array $data, string $key, mixed $recordValue): ?string
    {
        $value = array_key_exists($key, $data) ? $data[$key] : $recordValue;

        return filled($value) ? trim((string) $value) : null;
    }

    private function ensureComplete(MedicalCertificate $certificate): void
    {
        $missing = collect([
            'salutation' => $certificate->salutation,
            'patient_age' => $certificate->patient_age,
            'patient_sex' => $certificate->patient_sex,
            'patient_civil_status' => $certificate->patient_civil_status,
            'reason_for_consultation' => $certificate->reason_for_consultation,
            'clinical_impression' => $certificate->clinical_impression,
            'recommendation' => $certificate->recommendation,
            'physician_license_no' => $certificate->physician_license_no,
        ])->filter(fn (mixed $value, string $field): bool => $field === 'patient_age'
            ? $value === null
            : blank($value));

        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages($missing
                ->mapWithKeys(fn (mixed $value, string $field): array => [
                    $field => 'Complete this field before submitting the certificate.',
                ])->all());
        }
    }

    private function ensureAssignedPhysician(MedicalCertificate $certificate, User $actor): void
    {
        if ($actor->role !== 'doctor' || $certificate->attending_physician_id !== $actor->id) {
            throw ValidationException::withMessages([
                'certificate' => 'Only the assigned attending physician may perform this action.',
            ]);
        }
    }

    private function ensureVerifiedPhysician(User $actor): void
    {
        if ($actor->license_verification_status !== 'verified' || blank($actor->license_no)) {
            throw ValidationException::withMessages([
                'certificate' => 'A verified professional license is required before approving a medical certificate.',
            ]);
        }
    }

    private function ensureStatus(MedicalCertificate $certificate, array $allowed, string $message): void
    {
        if (! in_array($certificate->status, $allowed, true)) {
            throw ValidationException::withMessages(['status' => $message]);
        }
    }

    private function audit(
        MedicalCertificate $certificate,
        User $actor,
        string $action,
        ?string $oldStatus,
        ?string $newStatus,
        array $changes,
        Request $request,
    ): void {
        MedicalCertificateAudit::create([
            'medical_certificate_id' => $certificate->id,
            'actor_id' => $actor->id,
            'action' => $action,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'changes' => $changes === [] ? null : $changes,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    private function changes(MedicalCertificate $certificate): array
    {
        return [
            'fields' => array_values(array_keys(Arr::except($certificate->getChanges(), ['updated_at']))),
        ];
    }

    private function isSequenceConflict(QueryException $exception): bool
    {
        $message = Str::lower($exception->getMessage());

        return in_array((string) $exception->getCode(), ['23000', '23505'], true)
            && (str_contains($message, 'medical_certificates_year_sequence_unique')
                || str_contains($message, 'certificate_number')
                || str_contains($message, 'sequence_year'));
    }

    private function defaultRelations(): array
    {
        return [
            'patient.patientProfile',
            'appointment',
            'attendingPhysician',
            'creator',
            'approver',
            'issuer',
            'voider',
        ];
    }
}
