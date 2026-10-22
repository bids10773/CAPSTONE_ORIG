<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Foundation\Http\FormRequest;

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
        $require = fn (string $field): string => in_array($field, $required, true) ? 'required' : 'nullable';

        return [
            'submission_key' => ['required', 'uuid'],
            'measurement_type' => ['required', 'in:initial,recheck,correction'],
            'supersedes_id' => ['nullable', 'required_if:measurement_type,recheck,correction', 'integer', 'exists:vital_signs,id'],
            'systolic_pressure' => [$require('systolic_pressure'), 'integer', 'between:'.$limits['systolic_pressure']['min'].','.$limits['systolic_pressure']['max'], 'gt:diastolic_pressure'],
            'diastolic_pressure' => [$require('diastolic_pressure'), 'integer', 'between:'.$limits['diastolic_pressure']['min'].','.$limits['diastolic_pressure']['max']],
            'heart_rate' => [$require('heart_rate'), 'integer', 'between:'.$limits['pulse_rate']['min'].','.$limits['pulse_rate']['max']],
            'respiratory_rate' => [$require('respiratory_rate'), 'integer', 'between:'.$limits['respiratory_rate']['min'].','.$limits['respiratory_rate']['max']],
            'temperature' => [$require('temperature'), 'numeric', 'between:'.$limits['temperature']['min'].','.$limits['temperature']['max']],
            'oxygen_saturation' => [$require('oxygen_saturation'), 'numeric', 'between:'.$limits['oxygen_saturation']['min'].','.$limits['oxygen_saturation']['max']],
            'height' => [$require('height'), 'numeric', 'between:'.$limits['height']['min'].','.$limits['height']['max']],
            'weight' => [$require('weight'), 'numeric', 'between:'.$limits['weight']['min'].','.$limits['weight']['max']],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            '*.required' => 'This clinic-required measurement is missing.',
            'systolic_pressure.gt' => 'Systolic pressure must be greater than diastolic pressure.',
            '*.between' => 'The measurement is outside the clinic-approved validation range.',
        ];
    }
}
