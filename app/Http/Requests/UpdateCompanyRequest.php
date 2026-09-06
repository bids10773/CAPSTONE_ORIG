<?php

namespace App\Http\Requests;

use App\Models\Company;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('company')) ?? false;
    }

    public function rules(): array
    {
        /** @var Company $company */
        $company = $this->route('company');
        $loginId = $company->account()->value('id');

        return [
            'company_name' => ['required', 'string', 'max:255', Rule::unique('companies', 'company_name')->ignore($company)],
            'email' => [
                'required', 'string', 'email:rfc', 'max:255',
                Rule::unique('companies')->ignore($company),
                Rule::unique('users')->ignore($loginId),
            ],
            'contact_number' => ['required', 'string', 'max:30', 'regex:/^(?=(?:\D*\d){7,15}\D*$)\+?[\d\s().-]+$/'],
            'address' => ['required', 'string', 'max:500'],
            'industry_type' => ['required', 'string', Rule::in(array_keys(Company::getIndustryTypes()))],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_logo' => ['sometimes', 'boolean'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'representative_first_name' => ['required', 'string', 'max:100'],
            'representative_middle_name' => ['nullable', 'string', 'max:100'],
            'representative_last_name' => ['required', 'string', 'max:100'],
            'representative_position' => ['nullable', 'string', 'max:100'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $values = [];
        foreach ([
            'company_name', 'email', 'contact_number', 'address',
            'representative_first_name', 'representative_middle_name',
            'representative_last_name', 'representative_position',
        ] as $field) {
            if (is_string($this->input($field))) {
                $values[$field] = trim($this->input($field));
            }
        }

        if (isset($values['email'])) {
            $values['email'] = Str::lower($values['email']);
        }
        foreach (['representative_middle_name', 'representative_position'] as $nullable) {
            if (($values[$nullable] ?? null) === '') {
                $values[$nullable] = null;
            }
        }
        $this->merge($values);
    }

    public function messages(): array
    {
        return [
            'contact_number.regex' => 'Enter a valid mobile or telephone number with 7 to 15 digits.',
            'representative_first_name.required' => 'Representative first name is required.',
            'representative_last_name.required' => 'Representative last name is required.',
            'representative_position.max' => 'Representative position must not exceed 100 characters.',
        ];
    }
}
