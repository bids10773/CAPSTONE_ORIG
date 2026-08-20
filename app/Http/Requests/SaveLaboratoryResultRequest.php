<?php

namespace App\Http\Requests;

use App\Services\LaboratoryFormDefinition;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SaveLaboratoryResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('updateLaboratory', $this->route('appointment')) ?? false;
    }

    public function rules(): array
    {
        $rules = ['finalize' => ['required', 'boolean'], 'drug_workflow_action' => ['nullable', 'in:complete,send_verification'], 'remarks' => ['nullable', 'string', 'max:3000']];
        $sections = app(LaboratoryFormDefinition::class)->sectionsFor($this->route('appointment'));

        foreach ($sections as $sectionKey => $section) {
            foreach ($section['fields'] as $field) {
                $key = "results.{$sectionKey}.{$field['key']}";
                $rules[$key] = [
                    $this->boolean('finalize') ? 'required' : 'nullable',
                    $field['type'] === 'number' ? 'numeric' : 'string',
                    $field['type'] === 'number' ? 'max:999999' : 'max:1000',
                ];
            }
        }

        return $rules;
    }

    public function messages(): array
    {
        return ['results.*.*.required' => 'Complete every requested result before finalizing the laboratory report.'];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $allowed = array_keys(app(LaboratoryFormDefinition::class)->sectionsFor($this->route('appointment')));
            $submitted = array_keys($this->input('results', []));
            if ($allowed === []) {
                $validator->errors()->add('results', 'This appointment has no supported laboratory examination request.');
            }
            foreach (array_diff($submitted, $allowed) as $section) {
                $validator->errors()->add("results.{$section}", 'This laboratory examination was not requested for the appointment.');
            }
        }];
    }
}
