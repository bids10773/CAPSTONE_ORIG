<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinalizeMedicalEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('finalizeMedicalEvaluation', $this->route('appointment')) ?? false;
    }

    public function rules(): array
    {
        return [
            'medical_class' => ['required', 'in:A,B,C,pending,unfit'],
            'final_remarks' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
