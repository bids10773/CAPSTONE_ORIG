<?php

namespace App\Http\Requests;

use App\Models\Company;
use Illuminate\Foundation\Http\FormRequest;
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
        ];
    }

    public function messages(): array
    {
        return [
            'contact_number.regex' => 'Enter a valid mobile or telephone number with 7 to 15 digits.',
        ];
    }
}
