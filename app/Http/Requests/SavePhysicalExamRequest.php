<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SavePhysicalExamRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'blood_pressure' => preg_replace('/\s+/', '', (string) $this->input('blood_pressure')),
        ]);
    }

    public function authorize(): bool
    {
        return $this->user()?->can('updatePhysicalExam', $this->route('appointment')) ?? false;
    }

    public function rules(): array
    {
        $rules = [
            'height' => ['required', 'numeric', 'between:30,250'],
            'weight' => ['required', 'numeric', 'between:1,500'],
            'blood_pressure' => ['required', 'regex:/^\d{2,3}\/\d{2,3}$/'],
            'pulse_rate' => ['required', 'integer', 'between:20,250'],
            'respiration_rate' => ['required', 'integer', 'between:5,80'],
            'temperature' => ['required', 'numeric', 'between:30,45'],
            'visual_acuity' => ['required', 'string', 'max:100'],
            'hearing' => ['required', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:3000'],
        ];

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
            'blood_pressure.regex' => 'Enter blood pressure in systolic/diastolic format, for example 120/80.',
            '*.required' => 'This field is required.',
            '*.required_if' => 'Describe the abnormal finding before saving.',
        ];
    }

    public function attributes(): array
    {
        return [
            'pulse_rate' => 'pulse rate',
            'blood_pressure' => 'blood pressure',
        ];
    }

    public function bodyParts(): array
    {
        return ['head_scalp', 'eyes', 'ears', 'nose_sinuses', 'mouth_throat', 'neck_thyroid', 'chest_breast', 'lungs', 'heart', 'abdomen', 'back', 'anus', 'genitals', 'extremities', 'skin', 'dental'];
    }
}
