<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\PatientProfile;
use App\Models\SecurityAudit;
use App\Models\User;
use App\Support\PhilippineContactNumber;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $rateKey = 'registration:'.strtolower((string) ($input['email'] ?? '')).'|'.request()->ip();
        $maxAttempts = (int) config('medical.booking_security.registration_attempts_per_minute', 5);
        if (RateLimiter::tooManyAttempts($rateKey, $maxAttempts)) {
            throw ValidationException::withMessages(['email' => 'Too many registration attempts. Please try again shortly.']);
        }
        RateLimiter::hit($rateKey, 60);

        $validator = Validator::make($input, [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'contact' => ['required', 'string', 'max:20', function (string $attribute, mixed $value, \Closure $fail): void {
                if (PhilippineContactNumber::normalize((string) $value) === null) {
                    $fail('Enter a valid Philippine mobile number.');
                }
            }],

            'birthdate' => [
                'bail',
                'required',
                'date_format:Y-m-d',
                'before_or_equal:today',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $birthdate = \Carbon\CarbonImmutable::createFromFormat('Y-m-d', (string) $value)->startOfDay();
                    if ($birthdate !== false && ! $birthdate->isFuture() && $birthdate->gt(today()->subYearsNoOverflow(18))) {
                        $fail('You must be at least 18 years old to create an account.');
                    }
                },
            ],
            'sex' => ['required', 'string'],
            'civil_status' => ['required', 'string'],

            'password' => $this->passwordRules(),
        ], [
            ...$this->passwordValidationMessages(),
            'birthdate.required' => 'Please complete your birthdate.',
            'birthdate.date_format' => 'Please enter a valid birthdate.',
            'birthdate.before_or_equal' => 'Birthdate cannot be in the future.',
        ]);

        $validator->after(function ($validator) use ($input): void {
            $contact = PhilippineContactNumber::normalize($input['contact'] ?? null);
            if ($contact === null || empty($input['birthdate'])) {
                return;
            }

            $match = User::query()
                ->where('role', 'patient')
                ->whereHas('patientProfile', fn ($query) => $query->whereDate('birthdate', $input['birthdate']))
                ->get(['id', 'contact'])
                ->first(fn (User $candidate) => PhilippineContactNumber::normalize($candidate->contact) === $contact);

            if ($match !== null) {
                SecurityAudit::create([
                    'target_user_id' => $match->id,
                    'action' => 'possible_duplicate_account',
                    'status' => 'review',
                    'metadata' => ['ip_address' => request()->ip(), 'signal' => 'normalized_contact_and_birthdate'],
                ]);
                $validator->errors()->add('account', 'An account with matching patient information was found. Please sign in to your existing account or use account recovery.');
            }
        });

        $validator->validate();
        $input['contact'] = PhilippineContactNumber::normalize($input['contact']);

        return DB::transaction(function () use ($input): User {
            $user = User::create([
                'first_name' => $input['first_name'],
                'middle_name' => $input['middle_name'] ?? null,
                'last_name' => $input['last_name'],
                'email' => $input['email'],
                'contact' => $input['contact'],
                'password' => Hash::make($input['password']),
                'role' => 'patient',
                'is_active' => true,
            ]);

            PatientProfile::create([
                'user_id' => $user->id,
                'birthdate' => $input['birthdate'],
                'sex' => $input['sex'],
                'civil_status' => $input['civil_status'],
            ]);

            return $user;
        });
    }
}
