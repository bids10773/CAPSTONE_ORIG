<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompanyReferralRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'company'
            && $this->user()?->company?->status === 'active';
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'examination_purpose' => ['required', 'string', Rule::in(['pre_employment', 'annual_pe', 'medical_clearance'])],
            'service_types' => ['required', 'array', 'min:1'],
            'service_types.*' => ['string', 'distinct', Rule::in(array_keys(Appointment::getServiceTypeOptions()))],
        ];
    }
}
