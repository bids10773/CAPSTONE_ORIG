<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Carbon;

class Weekday implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        try {
            $date = Carbon::parse($value);
        } catch (\Throwable) {
            return;
        }

        if ($date->isWeekend()) {
            $fail('The :attribute must be Monday through Friday because the clinic is closed on weekends.');
        }
    }
}
