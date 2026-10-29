<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use App\Models\MedicalCertificate;
use App\Models\User;
use App\Support\ClinicHours;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveMedicalCertificateRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $trimmed = [];

        foreach ([
            'salutation',
            'reason_for_consultation',
            'clinical_impression',
            'recommendation',
            'patient_sex',
            'patient_civil_status',
        ] as $field) {
            if (is_string($this->input($field))) {
                $trimmed[$field] = trim($this->input($field));
            }
        }

        if ($trimmed !== []) {
            $this->merge($trimmed);
        }
    }

    public function authorize(): bool
    {
        $medicalCertificate = $this->route('medicalCertificate')
            ?? $this->route('medical_certificate')
            ?? $this->route('certificate');

        if ($medicalCertificate instanceof MedicalCertificate) {
            return $this->user()?->can('update', $medicalCertificate) ?? false;
        }

        return $this->user()?->can('create', MedicalCertificate::class) ?? false;
    }

    public function rules(): array
    {
        $patientId = (int) $this->input('patient_id');

        return [
            'save_action' => ['sometimes', Rule::in(['draft', 'approve'])],
            'patient_id' => [
                'bail',
                'required',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'patient'),
            ],
            'appointment_id' => [
                'nullable',
                'integer',
                Rule::exists('appointments', 'id')->where(
                    fn (Builder $query): Builder => $query->where('user_id', $patientId)
                ),
            ],
            'attending_physician_id' => [
                'bail',
                'required',
                'integer',
                Rule::exists(User::class, 'id')->where(
                    fn (Builder $query): Builder => $query
                        ->where('role', 'doctor')
                        ->where('is_active', true)
                ),
            ],
            'salutation' => ['required', 'string', Rule::in(['Mr.', 'Ms.', 'Mr', 'Ms'])],
            'consultation_date' => ['required', 'date', 'before_or_equal:'.ClinicHours::today()],
            'reason_for_consultation' => ['nullable', 'string', 'max:1500'],
            'clinical_impression' => ['nullable', 'string', 'max:1500'],
            'recommendation' => ['nullable', 'string', 'max:1500'],
            'rest_start_date' => ['nullable', 'required_with:rest_end_date', 'date', 'after_or_equal:consultation_date'],
            'rest_end_date' => ['nullable', 'required_with:rest_start_date', 'date', 'after_or_equal:rest_start_date'],
            'date_issued' => ['nullable', 'date', 'after_or_equal:consultation_date', 'before_or_equal:'.ClinicHours::today()],
            'patient_age' => ['nullable', 'integer', 'between:0,150'],
            'patient_sex' => ['nullable', 'string', 'max:30'],
            'patient_civil_status' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->user()?->role === 'doctor'
                    && (int) $this->input('attending_physician_id') !== $this->user()->id) {
                    $validator->errors()->add(
                        'attending_physician_id',
                        'Doctors may only prepare certificates assigned to themselves.'
                    );
                }

                if ($this->user()?->role !== 'doctor' || ! $this->integer('patient_id')) {
                    return;
                }

                $assignedAppointments = Appointment::query()
                    ->where('user_id', $this->integer('patient_id'))
                    ->where(fn (EloquentBuilder $query) => $this->scopeAssignedToDoctor(
                        $query,
                        $this->user()->id,
                    ));

                if (! (clone $assignedAppointments)->exists()) {
                    $validator->errors()->add(
                        'patient_id',
                        'You may only prepare a certificate for a patient assigned to you.'
                    );

                    return;
                }

                if ($this->integer('appointment_id')
                    && ! (clone $assignedAppointments)->whereKey($this->integer('appointment_id'))->exists()) {
                    $validator->errors()->add(
                        'appointment_id',
                        'The selected consultation is not assigned to you.'
                    );
                }
            },
        ];
    }

    private function scopeAssignedToDoctor(EloquentBuilder $query, int $doctorId): EloquentBuilder
    {
        return $query
            ->where('doctor_id', $doctorId)
            ->orWhereHas('medicalExamination', fn (EloquentBuilder $exam) => $exam
                ->where('examining_doctor_id', $doctorId)
                ->orWhere('finalized_by', $doctorId))
            ->orWhereHas('serviceQueues', fn (EloquentBuilder $queue) => $queue
                ->where('assigned_staff_id', $doctorId)
                ->whereIn('service_role', ['doctor', 'drug_verification', 'final_evaluation']));
    }

    public function messages(): array
    {
        return [
            'appointment_id.exists' => 'The selected consultation does not belong to this patient.',
            'attending_physician_id.exists' => 'Select an active physician account.',
            'rest_end_date.after_or_equal' => 'The rest end date must be on or after the rest start date.',
            'date_issued.after_or_equal' => 'The issue date cannot be before the consultation date.',
        ];
    }
}
