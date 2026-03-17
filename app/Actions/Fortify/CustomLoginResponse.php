<?php

namespace App\Actions\Fortify;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class CustomLoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        // Refresh user from database
        $user = $request->user()->fresh();

        // Check if user's email is verified
        if (!$user->hasVerifiedEmail()) {
            return redirect('/email/verify')
            ->with('error', 'Please verify your email first.');
        }

        // Role-based redirect
        return match($user->role) {
            'admin' => redirect('/admin/dashboard'),
            'doctor' => redirect('/doctor/dashboard'),
            'medtech' => redirect('/medtech/dashboard'),
            'radtech' => redirect('/radtech/dashboard'),
            'company' => redirect('/company/dashboard'),
            default => redirect('/dashboard'),
        };
    }
}
