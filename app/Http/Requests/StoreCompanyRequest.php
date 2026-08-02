<?php

namespace App\Http\Requests;

use App\Models\Company;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Company::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255', Rule::unique('companies', 'company_name')],
            'email' => ['required', 'string', 'email:rfc', 'max:255', Rule::unique('companies'), Rule::unique('users')],
            'contact_number' => ['required', 'string', 'regex:/^\+?[0-9][0-9\s().-]{7,19}$/'],
            'address' => ['required', 'string', 'max:500'],
            'industry_type' => ['required', 'string', Rule::in(array_keys(Company::getIndustryTypes()))],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
