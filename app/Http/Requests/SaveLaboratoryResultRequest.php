<?php

namespace App\Http\Requests;

use App\Services\LaboratoryFormDefinition;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveLaboratoryResultRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $results = $this->input('results', []);
        array_walk_recursive($results, function (&$value): void {
            if (is_string($value)) {
                $value = trim($value);
            }
        });

        $this->merge(['results' => $results]);
    }

    public function authorize(): bool
    {
        return $this->user()?->can('updateLaboratory', $this->route('appointment')) ?? false;
    }

    public function rules(): array
    {
        $rules = ['finalize' => ['required', 'boolean'], 'drug_workflow_action' => ['nullable', 'in:complete,send_verification,update_verification'], 'remarks' => ['nullable', 'string', 'max:3000']];
        $sections = app(LaboratoryFormDefinition::class)->sectionsFor($this->route('appointment'));

        foreach ($sections as $sectionKey => $section) {
            foreach ($section['fields'] as $field) {
                $key = "results.{$sectionKey}.{$field['key']}";
                $presence = $this->boolean('finalize') ? 'required' : 'nullable';

                if ($field['type'] === 'number') {
                    $validation = $field['validation'];
                    $rules[$key] = [
                        'bail', $presence,
                        'regex:/^\d+(?:\.\d{1,'.$validation['decimals'].'})?$/',
                        'numeric', 'between:'.$validation['min'].','.$validation['max'],
                    ];
                } elseif ($field['type'] === 'select') {
                    $rules[$key] = ['bail', $presence, 'string', Rule::in($field['options'])];
                } else {
                    $rules[$key] = ['bail', $presence, 'string', 'max:1000'];
                }
            }
        }

        return $rules;
    }

    public function messages(): array
    {
        $messages = [
            'results.*.*.required' => 'Complete every requested result before finalizing the laboratory report.',
            'results.*.*.in' => 'Select one of the available laboratory result options.',
        ];

        foreach (app(LaboratoryFormDefinition::class)->sectionsFor($this->route('appointment')) as $sectionKey => $section) {
            foreach ($section['fields'] as $field) {
                if ($field['type'] !== 'number') {
                    continue;
                }
                $key = "results.{$sectionKey}.{$field['key']}";
                $validation = $field['validation'];
                $messages["{$key}.regex"] = "{$field['label']} must be a plain number with no more than {$validation['decimals']} decimal places.";
                $messages["{$key}.between"] = "{$field['label']} must be between {$validation['min']} and {$validation['max']}".($field['unit'] ? " {$field['unit']}" : '').'.';
            }
        }

        return $messages;
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
