<?php

namespace App\Security;

use Illuminate\Http\Request;
use Laravel\Fortify\LoginRateLimiter as FortifyLoginRateLimiter;

class LoginRateLimiter extends FortifyLoginRateLimiter
{
    public const MAX_ATTEMPTS = 5;

    public function increment(Request $request): void
    {
        parent::increment($request);

        $this->flashState($request);
    }

    public function flashState(Request $request): void
    {
        $attempts = $this->attempts($request);
        $locked = $attempts >= self::MAX_ATTEMPTS;

        $request->session()->flash('login_attempt_limit', [
            'maxAttempts' => self::MAX_ATTEMPTS,
            'remainingAttempts' => max(0, self::MAX_ATTEMPTS - $attempts),
            'locked' => $locked,
            'retryAfter' => $locked ? $this->availableIn($request) : 0,
        ]);
    }
}
