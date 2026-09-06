<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReplyToInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('inquiry')) ?? false;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('response'))) {
            $this->merge(['response' => trim($this->input('response'))]);
        }
    }

    public function rules(): array
    {
        return [
            'response' => ['required', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'response.required' => 'Enter a response before sending.',
            'response.max' => 'Response must not exceed 5,000 characters.',
        ];
    }
}
