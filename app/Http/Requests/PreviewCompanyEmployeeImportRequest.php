<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'bulk_appointment_id' => [
                'nullable',
                'integer',
                Rule::exists('appointments', 'id')->where(fn ($query) => $query
                    ->where('company_id', $this->user()->company_id)
                    ->where('type', 'company_bulk')
                    ->whereNull('bulk_appointment_id')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Select an employee spreadsheet to continue.',
            'file.mimes' => 'Upload an XLSX, XLS, or CSV spreadsheet.',
            'file.max' => 'The spreadsheet must not exceed 10 MB.',
            'bulk_appointment_id.exists' => 'Select a valid bulk appointment belonging to your company.',
        ];
    }
}
