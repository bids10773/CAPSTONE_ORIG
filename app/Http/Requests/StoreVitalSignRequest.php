<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreVitalSignRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        foreach (['systolic_pressure', 'diastolic_pressure', 'heart_rate', 'respiratory_rate', 'temperature', 'oxygen_saturation', 'height', 'weight'] as $field) {
            $this->merge([$field => $this->filled($field) ? trim((string) $this->input($field)) : null]);
        }
    }

    public function authorize(): bool
    {
        $appointment = $this->route('appointment');

        return $appointment instanceof Appointment
            && $this->user()?->role === 'receptionist'
            && $appointment->user?->role === 'patient'
            && $appointment->bulk_appointment_id === null;
    }

    public function rules(): array
    {
        $limits = config('physical_exam.vital_limits');
        $required = config('physical_exam.required_vital_signs', []);
        $draft = $this->input('save_action') === 'draft';
        $notAssessed = $this->input('not_assessed', []);
        $notAssessed = is_array($notAssessed) ? $notAssessed : [];
        $require = fn (string $field): string => ! $draft && ! array_key_exists($field, $notAssessed)
            && in_array($field, $required, true) ? 'required' : 'nullable';

        return [
            'save_action' => ['sometimes', 'in:draft,complete'],
            'not_assessed' => ['sometimes', 'array:systolic_pressure,diastolic_pressure,heart_rate,respiratory_rate,temperature,oxygen_saturation,height,weight,visual_acuity,hearing'],
            'not_assessed.*' => [$draft ? 'nullable' : 'required', 'string', 'max:1000'],
            'submission_key' => ['required', 'uuid'],
            'measurement_type' => ['required', 'in:initial,recheck,correction'],
            'supersedes_id' => ['nullable', 'required_if:measurement_type,recheck,correction', 'integer', 'exists:vital_signs,id'],
            'systolic_pressure' => [$require('systolic_pressure'), 'integer', 'between:'.$limits['systolic_pressure']['min'].','.$limits['systolic_pressure']['max'], ...($this->filled('diastolic_pressure') ? ['gt:diastolic_pressure'] : [])],
            'diastolic_pressure' => [$require('diastolic_pressure'), 'integer', 'between:'.$limits['diastolic_pressure']['min'].','.$limits['diastolic_pressure']['max']],
            'heart_rate' => [$require('heart_rate'), 'integer', 'between:'.$limits['pulse_rate']['min'].','.$limits['pulse_rate']['max']],
            'respiratory_rate' => [$require('respiratory_rate'), 'integer', 'between:'.$limits['respiratory_rate']['min'].','.$limits['respiratory_rate']['max']],
            'temperature' => [$require('temperature'), 'numeric', 'between:'.$limits['temperature']['min'].','.$limits['temperature']['max']],
            'oxygen_saturation' => [$require('oxygen_saturation'), 'numeric', 'between:'.$limits['oxygen_saturation']['min'].','.$limits['oxygen_saturation']['max']],
            'height' => [$require('height'), 'numeric', 'between:'.$limits['height']['min'].','.$limits['height']['max']],
            'weight' => [$require('weight'), 'numeric', 'between:'.$limits['weight']['min'].','.$limits['weight']['max']],
            'visual_acuity' => [$draft || array_key_exists('visual_acuity', $notAssessed) ? 'nullable' : 'required', 'string', 'max:100'],
            'hearing' => [$draft || array_key_exists('hearing', $notAssessed) ? 'nullable' : 'required', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'not_assessed.*.required' => 'Explain why this measurement was not assessed before completing intake.',
            'visual_acuity.required' => 'Record the visual acuity screening result.',
            'hearing.required' => 'Record the hearing screening result.',
            '*.required' => 'This clinic-required measurement is missing.',
            'systolic_pressure.gt' => 'Systolic pressure must be greater than diastolic pressure.',
            '*.between' => 'The measurement is outside the clinic-approved validation range.',
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $notAssessed = $this->input('not_assessed', []);
            if (! is_array($notAssessed)) {
                return;
            }
            foreach (array_keys($notAssessed) as $field) {
                if ($this->filled($field)) {
                    $validator->errors()->add($field, 'Remove the measurement or clear its Not assessed selection.');
                }
            }
        }];
    }
}
