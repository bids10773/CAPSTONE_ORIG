<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VerifyXrayResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('verifyDiagnosticResults', $this->route('appointment')) ?? false;
    }

    public function rules(): array
    {
        return [
            'result' => ['required', Rule::in(['normal_chest', 'with_findings', 'for_repeat', 'cancelled'])],
            'findings' => ['required_unless:result,cancelled', 'nullable', 'string', 'max:5000'],
            'impression' => ['required_unless:result,cancelled', 'nullable', 'string', 'max:3000'],
            'remarks' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
