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
            Fortify::username() => ['Too many failed login attempts.'],
        ])->status(429);
    }
}
