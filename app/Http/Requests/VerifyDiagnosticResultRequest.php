<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VerifyDiagnosticResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('verifyDiagnosticResults', $this->route('appointment')) ?? false;
    }

    public function rules(): array
    {
        return [
            'result' => ['required', Rule::in(['negative', 'positive_confirmed', 'inconclusive_repeat', 'cancelled'])],
            'official_reference_number' => ['nullable', 'string', 'max:100'],
            'official_result_date' => ['required', 'date', 'before_or_equal:today'],
            'remarks' => ['nullable', 'string', 'max:3000'],
            'supporting_document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }
}
