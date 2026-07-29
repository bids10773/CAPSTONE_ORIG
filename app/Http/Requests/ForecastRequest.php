<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ForecastRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'disease' => ['nullable', 'string', 'max:100'],
            'year' => ['nullable', 'integer', 'between:2000,2100'],
            'horizon' => ['nullable', 'integer', 'between:1,36'],
            'season_length' => ['nullable', 'integer', 'between:2,24'],
            'alpha' => ['nullable', 'numeric', 'gt:0', 'lte:1'],
            'beta' => ['nullable', 'numeric', 'gt:0', 'lte:1'],
            'gamma' => ['nullable', 'numeric', 'gt:0', 'lte:1'],
        ];
    }
}
