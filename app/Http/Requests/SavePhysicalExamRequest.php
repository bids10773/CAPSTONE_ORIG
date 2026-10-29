<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SavePhysicalExamRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $bloodPressure = preg_replace('/\s+/', '', trim((string) $this->input('blood_pressure')));
        $systolic = $this->input('systolic_pressure');
        $diastolic = $this->input('diastolic_pressure');

        if (($systolic === null || $diastolic === null)
            && preg_match('/^(\d{2,3})\/(\d{2,3})$/', $bloodPressure, $matches)) {
            $systolic ??= $matches[1];
            $diastolic ??= $matches[2];
        }

        $this->merge([
            'height' => trim((string) $this->input('height')),
            'weight' => trim((string) $this->input('weight')),
            'pulse_rate' => trim((string) $this->input('pulse_rate')),
            'temperature' => trim((string) $this->input('temperature')),
            'systolic_pressure' => is_scalar($systolic) ? trim((string) $systolic) : $systolic,
            'diastolic_pressure' => is_scalar($diastolic) ? trim((string) $diastolic) : $diastolic,
        ]);
    }

    public function authorize(): bool
    {
        return $this->user()?->can('updatePhysicalExam', $this->route('appointment')) ?? false;
    }

    public function rules(): array
    {
        $rules = [
            'remarks' => ['nullable', 'string', 'max:3000'],
            'vital_signs_override_reason' => ['nullable', 'string', 'max:1000'],
        ];
        if ($this->route('appointment')->examination_purpose === 'medical_clearance') {
            $rules['requested_services'] = ['sometimes', 'array'];
            $rules['requested_services.*'] = ['string', 'distinct', \Illuminate\Validation\Rule::in(
                array_keys(\App\Models\Appointment::getBookableServiceTypeOptions())
            )];
        }

        foreach ($this->bodyParts() as $field) {
            $rules["{$field}_status"] = ['required', 'in:normal,with_findings'];
            $rules[$field] = ['nullable', 'required_if:'.$field.'_status,with_findings', 'string', 'max:1000'];
        }
        foreach (['present_illness', 'past_medical_history', 'operations_accidents', 'family_history', 'allergies', 'personal_social_history', 'ob_menstrual_history'] as $field) {
            $rules[$field] = ['nullable', 'string', 'max:3000'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'height.regex' => 'Please enter a valid height with no more than one decimal place.',
            'height.between' => 'Height must be between 30 and 300 cm.',
            'weight.regex' => 'Please enter a valid weight with no more than one decimal place.',
            'weight.between' => 'Weight must be between 1 and 500 kg.',
            'pulse_rate.regex' => 'Please enter a valid whole-number pulse.',
            'pulse_rate.between' => 'Pulse must be between 20 and 250 bpm.',
            'temperature.regex' => 'Please enter a valid temperature with no more than one decimal place.',
            'temperature.between' => 'Temperature must be between 30.0°C and 45.0°C.',
            'systolic_pressure.required' => 'Please enter both systolic and diastolic blood pressure.',
            'diastolic_pressure.required' => 'Please enter both systolic and diastolic blood pressure.',
            'systolic_pressure.regex' => 'Systolic pressure must be a whole number.',
            'diastolic_pressure.regex' => 'Diastolic pressure must be a whole number.',
            'systolic_pressure.between' => 'Systolic pressure must be between 50 and 300 mm Hg.',
            'diastolic_pressure.between' => 'Diastolic pressure must be between 30 and 200 mm Hg.',
            'systolic_pressure.gt' => 'Systolic pressure must be greater than diastolic pressure.',
            '*.required' => 'This field is required.',
            '*.required_if' => 'Describe the abnormal finding before saving.',
        ];
    }

    public function attributes(): array
    {
        return [
            'pulse_rate' => 'pulse rate',
            'blood_pressure' => 'blood pressure',
            'systolic_pressure' => 'systolic pressure',
            'diastolic_pressure' => 'diastolic pressure',
        ];
    }

    public function bloodPressure(): string
    {
        return $this->validated('systolic_pressure').'/'.$this->validated('diastolic_pressure');
    }

    public function bodyParts(): array
    {
        return ['head_scalp', 'eyes', 'ears', 'nose_sinuses', 'mouth_throat', 'neck_thyroid', 'chest_breast', 'lungs', 'heart', 'abdomen', 'back', 'anus', 'genitals', 'extremities', 'skin', 'dental'];
    }
}
