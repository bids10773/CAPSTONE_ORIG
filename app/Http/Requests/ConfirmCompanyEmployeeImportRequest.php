<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmCompanyEmployeeImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'company' && $this->user()?->company_id !== null;
    }

    public function rules(): array
    {
        return [
            'preview_token' => ['required', 'uuid'],
        ];
    }
}
