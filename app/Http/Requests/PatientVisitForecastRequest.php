<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PatientVisitForecastRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'year' => ['nullable', 'integer', 'between:2021,2025'],
            'horizon' => ['nullable', 'integer', 'in:3,6,12'],
        ];
    }
}
