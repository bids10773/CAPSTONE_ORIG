<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
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
        Validator::make($input, [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'contact' => ['required', 'string', 'max:11'],

            'birthdate' => ['required', 'date'],
            'sex' => ['required', 'string'],
            'civil_status' => ['required', 'string'],

            'password' => $this->passwordRules(),
        ])->validate();

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
