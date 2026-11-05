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
        $presence = $this->input('save_action') === 'draft' ? 'nullable' : 'required';

        return [
            'save_action' => ['sometimes', 'in:draft,complete'],
            'medical_class' => [$presence, 'in:A,B,C,pending,unfit'],
            'final_diagnosis' => [$presence, 'string', 'max:3000'],
            'final_remarks' => ['nullable', 'string', 'max:3000'],
            'recommendations' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
