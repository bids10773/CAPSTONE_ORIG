<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWalkInRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null || $user->cannot('walkin.create')) {
            return false;
        }

        return $this->input('patient_type') === 'new'
            ? $user->can('patient.register')
            : $user->can('patient.search');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_type' => ['required', Rule::in(['existing', 'new'])],
            'user_id' => [
                'nullable',
                'required_if:patient_type,existing',
                Rule::exists(User::class, 'id')->where('role', 'patient')->where('is_active', true),
            ],
            'first_name' => ['nullable', 'required_if:patient_type,new', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'required_if:patient_type,new', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique(User::class, 'email')],
            'contact' => ['nullable', 'string', 'max:20'],
            'birthdate' => ['nullable', 'date', 'before_or_equal:today'],
            'sex' => ['nullable', Rule::in(['Male', 'Female'])],
            'civil_status' => ['nullable', Rule::in(['Single', 'Married', 'Divorced', 'Widowed', 'Separated'])],
            'examination_purpose' => ['required', 'string', Rule::in(['pre_employment', 'annual_pe', 'medical_clearance'])],
            'service_types' => ['required', 'array', 'min:1'],
            'service_types.*' => ['required', 'string', Rule::in(array_keys(\App\Models\Appointment::getServiceTypeOptions()))],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
