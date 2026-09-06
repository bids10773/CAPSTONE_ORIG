<?php

namespace App\Http\Requests;

use App\Enums\InquiryCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $values = [];

        foreach ([
            'category',
            'sender_first_name',
            'sender_middle_name',
            'sender_last_name',
            'representative_position',
            'company_name',
            'email',
            'contact_number',
            'subject',
            'message',
        ] as $field) {
            $value = $this->input($field);
            if (is_string($value)) {
                $values[$field] = trim($value);
            }
        }

        if (isset($values['email'])) {
            $values['email'] = Str::lower($values['email']);
        }

        foreach (['sender_middle_name', 'representative_position', 'company_name', 'contact_number'] as $nullable) {
            if (($values[$nullable] ?? null) === '') {
                $values[$nullable] = null;
            }
        }

        $this->merge($values);
    }

    public function rules(): array
    {
        $requiresCompany = fn (): bool => $this->input('category') === InquiryCategory::CompanyAccount->value;

        return [
            'submission_key' => ['required', 'uuid'],
            'category' => ['required', Rule::enum(InquiryCategory::class)],
            'sender_first_name' => ['required', 'string', 'max:100'],
            'sender_middle_name' => ['nullable', 'string', 'max:100'],
            'sender_last_name' => ['required', 'string', 'max:100'],
            'representative_position' => ['nullable', 'string', 'max:100'],
            'company_name' => [Rule::requiredIf($requiresCompany), 'nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
            'contact_number' => [Rule::requiredIf($requiresCompany), 'nullable', 'string', 'max:30', 'regex:/^(?=(?:\D*\d){7,15}\D*$)\+?[\d\s().-]+$/'],
            'subject' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'sender_first_name.required' => 'First name is required.',
            'sender_last_name.required' => 'Last name is required.',
            'representative_position.max' => 'Representative position must not exceed 100 characters.',
            'company_name.required' => 'Company name is required for a company account inquiry.',
            'contact_number.required' => 'Company contact number is required for a company account inquiry.',
            'contact_number.regex' => 'Enter a valid mobile or telephone number with 7 to 15 digits.',
            'message.max' => 'Message must not exceed 5,000 characters.',
        ];
    }
}
