<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PatientVisitForecastRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'start_date' => ['nullable', 'required_with:end_date', 'date_format:Y-m-d', 'before_or_equal:end_date'],
            'end_date' => ['nullable', 'required_with:start_date', 'date_format:Y-m-d', 'before_or_equal:today', 'after_or_equal:start_date'],
            'daily_horizon' => ['nullable', 'integer', Rule::in([7, 14, 30, 60])],
            'monthly_horizon' => ['nullable', 'integer', Rule::in([3, 6, 12])],
        ];
    }
}
