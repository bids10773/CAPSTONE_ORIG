<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveXrayReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('updateXray', $this->route('appointment')) ?? false;
    }

    public function rules(): array
    {
        return [
            'chest_status' => ['required', 'in:normal,findings'],
            'chest_findings' => ['required', 'string', 'max:5000'],
            'impression' => ['required', 'string', 'max:3000'],
        ];
    }
}
