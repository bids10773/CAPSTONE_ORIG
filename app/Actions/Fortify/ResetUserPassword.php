<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use App\Notifications\PasswordChanged;
use App\Services\SessionRevocationService;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\ResetsUserPasswords;
use Laravel\Fortify\LoginRateLimiter;

class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordValidationRules;

    public function __construct(private readonly SessionRevocationService $sessions, private readonly LoginRateLimiter $limiter) {}

    /**
     * Validate and reset the user's forgotten password.
     *
     * @param  array<string, string>  $input
     */
    public function reset(User $user, array $input): void
    {
        Validator::make($input, [
            'password' => $this->passwordRules(),
        ], $this->passwordValidationMessages())->validate();

        $user->forceFill([
            'password' => $input['password'],
            'failed_login_attempts' => 0,
            'login_locked_at' => null,
        ])->save();

        $this->sessions->revoke($user);
        $this->limiter->clear(request());

        $user->notify(new PasswordChanged);
    }
}
