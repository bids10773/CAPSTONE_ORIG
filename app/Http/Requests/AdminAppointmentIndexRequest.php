<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminAppointmentIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in([
                'pending', 'accepted', 'arrived', 'for_diagnostics', 'for_xray',
                'for_final_evaluation', 'completed', 'rejected', 'cancelled',
            ])],
            'type' => ['nullable', Rule::in(array_keys(Appointment::getTypeOptions()))],
            'date_filter' => ['nullable', Rule::in(['today', 'upcoming', 'past'])],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'doctor_id' => [
                'nullable', 'integer',
                Rule::exists('users', 'id')->where(fn ($query) => $query
                    ->where('role', 'doctor')->where('is_active', true)),
            ],
            'company_id' => ['nullable', 'integer', Rule::exists('companies', 'id')],
            'sort' => ['nullable', Rule::in(['appointment_date', 'status', 'created_at'])],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50, 100])],
        ];
    }
}
