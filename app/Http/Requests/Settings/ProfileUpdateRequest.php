<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->profileRules($this->user()->id);
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'birthdate.date_format' => 'Please enter a valid birthdate.',
            'birthdate.before_or_equal' => 'Birthdate cannot be in the future.',
            'sex.in' => 'Please select a valid sex.',
            'civil_status.in' => 'Please select a valid civil status.',
        ];
    }
}
