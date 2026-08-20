<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveXrayReportRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['workflow_action' => $this->input('workflow_action', 'complete')]);
    }

    public function authorize(): bool
    {
        return $this->user()?->can('updateXray', $this->route('appointment')) ?? false;
    }

    public function rules(): array
    {
        return [
            'workflow_action' => ['required', 'in:performed,send_verification,complete'],
            'chest_status' => ['nullable', 'required_if:workflow_action,complete', 'in:normal,findings'],
            'chest_findings' => ['nullable', 'required_if:workflow_action,complete', 'string', 'max:5000'],
            'impression' => ['nullable', 'required_if:workflow_action,complete', 'string', 'max:3000'],
            'recommendation' => ['nullable', 'string', 'max:3000'],
            'remarks' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
