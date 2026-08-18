<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PasswordComplexity implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        $categories = 0;
        $categories += preg_match('/[A-Z]/', $value) === 1 ? 1 : 0;
        $categories += preg_match('/[a-z]/', $value) === 1 ? 1 : 0;
        $categories += preg_match('/[0-9]/', $value) === 1 ? 1 : 0;
        $categories += preg_match('/[^\p{L}\p{N}]/u', $value) === 1 ? 1 : 0;

        if ($categories < 3) {
            $fail('Password must contain at least 3 of the following: an uppercase letter, a lowercase letter, a number, and a symbol.');
        }
    }
}
