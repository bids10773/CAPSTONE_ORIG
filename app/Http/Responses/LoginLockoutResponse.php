<?php

namespace App\Http\Responses;

use App\Models\User;
use App\Security\LoginRateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\LockoutResponse as LockoutResponseContract;
use Laravel\Fortify\Fortify;

class LoginLockoutResponse implements LockoutResponseContract
{
    public function __construct(private readonly LoginRateLimiter $limiter) {}

    public function toResponse($request)
    {
        /** @var Request $request */
        $this->limiter->flashState($request);
        $email = Str::lower(trim((string) $request->input(Fortify::username())));
        $permanentlyLocked = User::query()
            ->where('email', $email)
            ->whereNotNull('login_locked_at')
            ->exists();

        throw ValidationException::withMessages([
            Fortify::username() => [$permanentlyLocked
                ? 'Your account is locked. Reset your password by email to unlock it.'
                : 'Too many failed login attempts. Please try again shortly.'],
        ])->status(429);
    }
}
