<?php

namespace App\Actions\Fortify;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class CustomLoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user()->fresh();

        if (! $user->hasVerifiedEmail()) {
            // The auth middleware stores a signed verification link as the
            // intended URL. Return to it after login to finish verification
            // without making the user manually open the email link again.
            return redirect()->intended(route('verification.notice'))
                ->with('error', 'Please verify your email first.');
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
