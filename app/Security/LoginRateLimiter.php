<?php

namespace App\Security;

use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Fortify\LoginRateLimiter as FortifyLoginRateLimiter;

class LoginRateLimiter extends FortifyLoginRateLimiter
{
    public const MAX_ATTEMPTS = 5;

    public const WARNING_AFTER_ATTEMPTS = 3;

    public const IP_MAX_ATTEMPTS = 20;

    public const IP_HOURLY_MAX_ATTEMPTS = 50;

    public const ACCOUNT_LOCK_MESSAGE = 'Your account is locked after five failed sign-in attempts. Reset your password to unlock it.';

    public function tooManyAttempts(Request $request): bool
    {
        return parent::tooManyAttempts($request)
            || $this->limiter->tooManyAttempts($this->ipKey($request), self::IP_MAX_ATTEMPTS)
            || $this->limiter->tooManyAttempts($this->hourlyIpKey($request), self::IP_HOURLY_MAX_ATTEMPTS);
    }

    public function increment(Request $request): void
    {
        parent::increment($request);
        $ipAttempts = $this->limiter->hit($this->ipKey($request), 60);
        $hourlyAttempts = $this->limiter->hit($this->hourlyIpKey($request), 3600);

        DB::transaction(function () use ($request): void {
            $user = $this->userFor($request, lock: true);

            if (! $user || $user->isLoginLocked()) {
                return;
            }

            $user->failed_login_attempts = min(self::MAX_ATTEMPTS, $user->failed_login_attempts + 1);

            if ($user->failed_login_attempts === self::MAX_ATTEMPTS) {
                $user->login_locked_at = now();
                SecurityAudit::create([
                    'target_user_id' => $user->id,
                    'action' => 'account_locked_after_failed_attempts',
                    'status' => 'blocked',
                    'metadata' => ['failed_attempts' => self::MAX_ATTEMPTS, 'ip' => $request->ip()],
                ]);
            }

            $user->save();
        });

        if ($this->attempts($request) === self::MAX_ATTEMPTS || $ipAttempts === self::IP_MAX_ATTEMPTS || $hourlyAttempts === self::IP_HOURLY_MAX_ATTEMPTS) {
            SecurityAudit::create([
                'target_user_id' => $this->userFor($request)?->id,
                'action' => 'login_throttled_after_failed_attempts',
                'status' => 'blocked',
                'metadata' => ['failed_attempts' => $this->attempts($request), 'ip' => $request->ip()],
            ]);
        }

        $this->flashState($request);
    }

    public function clear(Request $request): void
    {
        parent::clear($request);
        // Aggregate IP budgets survive both successful sign-in and password recovery.
    }

    public function availableIn(Request $request)
    {
        return max(
            parent::availableIn($request),
            $this->limiter->tooManyAttempts($this->ipKey($request), self::IP_MAX_ATTEMPTS)
                ? $this->limiter->availableIn($this->ipKey($request)) : 0,
            $this->limiter->tooManyAttempts($this->hourlyIpKey($request), self::IP_HOURLY_MAX_ATTEMPTS)
                ? $this->limiter->availableIn($this->hourlyIpKey($request)) : 0,
        );
    }

    public function flashState(Request $request): void
    {
        $attempts = $this->attempts($request);
        $locked = $this->tooManyAttempts($request);

        $request->session()->flash('login_attempt_limit', [
            'maxAttempts' => self::MAX_ATTEMPTS,
            'warningAfterAttempts' => self::WARNING_AFTER_ATTEMPTS,
            'failedAttempts' => min(self::MAX_ATTEMPTS, $attempts),
            'remainingAttempts' => max(0, self::MAX_ATTEMPTS - $attempts),
            'locked' => $locked,
        ]);
    }

    private function ipKey(Request $request): string
    {
        return 'login-ip:'.hash('sha256', (string) $request->ip());
    }

    private function hourlyIpKey(Request $request): string
    {
        return 'login-ip-hour:'.hash('sha256', (string) $request->ip());
    }

    private function userFor(Request $request, bool $lock = false): ?User
    {
        $email = Str::lower(trim((string) $request->input('email')));

        if ($email === '') {
            return null;
        }

        return User::query()->where('email', $email)->when($lock, fn ($query) => $query->lockForUpdate())->first();
    }
}
