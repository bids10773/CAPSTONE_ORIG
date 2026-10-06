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

    public function tooManyAttempts(Request $request): bool
    {
        $user = $this->userFor($request);

        return $user
            ? $user->login_locked_at !== null
            : parent::tooManyAttempts($request);
    }

    public function increment(Request $request): void
    {
        parent::increment($request);

        $user = $this->userFor($request);

        if ($user) {
            DB::transaction(function () use ($request, $user): void {
                $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);

                if ($lockedUser->login_locked_at !== null) {
                    return;
                }

                $attempts = min(self::MAX_ATTEMPTS, $lockedUser->failed_login_attempts + 1);

                $lockedUser->forceFill([
                    'failed_login_attempts' => $attempts,
                    'login_locked_at' => $attempts >= self::MAX_ATTEMPTS ? now() : null,
                ])->save();

                if ($lockedUser->login_locked_at !== null) {
                    SecurityAudit::create([
                        'target_user_id' => $lockedUser->id,
                        'action' => 'account_locked_after_failed_logins',
                        'status' => 'blocked',
                        'metadata' => [
                            'failed_attempts' => $attempts,
                            'ip' => $request->ip(),
                        ],
                    ]);
                }
            });
        }

        $this->flashState($request);
    }

    public function clear(Request $request): void
    {
        parent::clear($request);

        $this->userFor($request)?->forceFill([
            'failed_login_attempts' => 0,
            'login_locked_at' => null,
        ])->save();
    }

    public function flashState(Request $request): void
    {
        $user = $this->userFor($request);
        $attempts = $user?->failed_login_attempts ?? $this->attempts($request);
        $locked = $user?->login_locked_at !== null || $attempts >= self::MAX_ATTEMPTS;

        $request->session()->flash('login_attempt_limit', [
            'maxAttempts' => self::MAX_ATTEMPTS,
            'warningAfterAttempts' => self::WARNING_AFTER_ATTEMPTS,
            'failedAttempts' => min(self::MAX_ATTEMPTS, $attempts),
            'remainingAttempts' => max(0, self::MAX_ATTEMPTS - $attempts),
            'locked' => $locked,
        ]);
    }

    private function userFor(Request $request): ?User
    {
        $email = Str::lower(trim((string) $request->input('email')));

        return $email === '' ? null : User::query()->where('email', $email)->first();
    }
}
