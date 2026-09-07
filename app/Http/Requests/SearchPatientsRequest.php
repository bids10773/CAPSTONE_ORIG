<?php

namespace App\Http\Requests;

use App\Support\SearchTerm;
use Illuminate\Foundation\Http\FormRequest;

class SearchPatientsRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('q'))) {
            $this->merge(['q' => SearchTerm::normalize($this->input('q'))]);
        }
    }

    public function authorize(): bool
    {
        return $this->user()?->can('patient.search') === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ];
    }
}
