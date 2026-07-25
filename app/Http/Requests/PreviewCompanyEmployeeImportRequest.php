<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreviewCompanyEmployeeImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'company' && $this->user()?->company_id !== null;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Select an employee spreadsheet to continue.',
            'file.mimes' => 'Upload an XLSX, XLS, or CSV spreadsheet.',
            'file.max' => 'The spreadsheet must not exceed 10 MB.',
        ];
    }
}
