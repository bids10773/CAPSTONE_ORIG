<?php

namespace App\Actions\Fortify;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class CustomLoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        // Check if user's email is verified
        if (!$user->hasVerifiedEmail()) {
            return redirect('/email/verify');
        }

        // Always redirect based on user role - ignore intended URL to prevent race conditions
        return match($user->role) {
            'admin' => redirect('/admin/dashboard'),
            'doctor' => redirect('/doctor/dashboard'),
            'medtech' => redirect('/medtech/dashboard'),
            'radtech' => redirect('/radtech/dashboard'),
            'company' => redirect('/company/dashboard'),
            default => redirect('/dashboard'), // patient - redirect to dashboard
        };
    }
}
