<?php

namespace App\Http\Responses;

use App\Security\LoginRateLimiter;
use Illuminate\Http\Request;
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

        throw ValidationException::withMessages([
            Fortify::username() => ['Too many sign-in attempts. Please wait before trying again, or reset your password if your account is locked.'],
        ])->status(429);
    }
}
