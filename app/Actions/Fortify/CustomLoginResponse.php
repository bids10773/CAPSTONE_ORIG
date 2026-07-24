<?php

namespace App\Actions\Fortify;

use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class CustomLoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user()->fresh();
        $preVerifiedRoles = [
            'admin',
            'doctor',
            'medtech',
            'radtech',
            'company',
            'receptionist',
        ];

        if (! $user->hasVerifiedEmail() && in_array($user->role, $preVerifiedRoles, true)) {
            $user->markEmailAsVerified();
            $user->refresh();
        }

        if (! $user->hasVerifiedEmail()) {
            // The auth middleware stores a signed verification link as the
            // intended URL. Return to it after login to finish verification
            // without making the user manually open the email link again.
            return redirect()->intended(route('verification.notice'))
                ->with('error', 'Please verify your email first.');
        }

        if ($user->must_change_password) {
            if ($user->temporary_password_expires_at?->isPast()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')
                    ->with('error', 'Your temporary password has expired. Ask an administrator to resend your credentials.');
            }

            return redirect()->route('temporary-password.edit');
        }

        $destination = match ($user->role) {
            'admin' => '/admin/dashboard',
            'doctor' => '/doctor/dashboard',
            'medtech' => '/medtech/dashboard',
            'radtech' => '/radtech/dashboard',
            'company' => '/company/dashboard',
            'receptionist' => '/receptionist/dashboard',
            default => '/dashboard',
        };

        return redirect()->intended($destination);
    }
}
