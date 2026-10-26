<?php

namespace App\Http\Requests\Auth;

use App\Security\LoginRateLimiter;
use Illuminate\Http\Exceptions\HttpResponseException;
use Laravel\Fortify\Http\Requests\TwoFactorLoginRequest as FortifyTwoFactorLoginRequest;

class TwoFactorLoginRequest extends FortifyTwoFactorLoginRequest
{
    public function challengedUser()
    {
        $user = parent::challengedUser();

        if ($user->isLoginLocked()) {
            $this->session()->forget(['login.id', 'login.remember']);

            throw new HttpResponseException($this->expectsJson()
                ? response()->json(['message' => LoginRateLimiter::ACCOUNT_LOCK_MESSAGE], 422)
                : redirect()->route('login')->withErrors(['email' => LoginRateLimiter::ACCOUNT_LOCK_MESSAGE]));
        }

        return $user;
    }
}
