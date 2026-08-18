<?php

namespace App\Concerns;

use App\Rules\PasswordComplexity;
use Illuminate\Contracts\Validation\Rule;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * @return array<int, Rule|array<mixed>|string>
     */
    protected function passwordRules(bool $required = true): array
    {
        return [
            $required ? 'required' : 'nullable',
            'string',
            'min:8',
            new PasswordComplexity,
            'confirmed',
        ];
    }

    /**
     * Get the user-facing messages shared by password creation flows.
     *
     * @return array<string, string>
     */
    protected function passwordValidationMessages(): array
    {
        return [
            'password.min' => 'Password must be at least 8 characters long.',
            'password.confirmed' => 'Passwords do not match.',
        ];
    }

    /**
     * Get the validation rules used to validate the current password.
     *
     * @return array<int, Rule|array<mixed>|string>
     */
    protected function currentPasswordRules(): array
    {
        return ['required', 'string', 'current_password'];
    }
}
