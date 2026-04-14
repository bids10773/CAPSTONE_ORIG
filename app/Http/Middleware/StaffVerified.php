<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class StaffVerified
{
    /**
     * Handle an incoming request.
     * Allows staff roles (doctor, medtech, radtech, admin) created by admin to bypass email verification.
     * Does NOT affect password reset - that works independently.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        
        // If user is not logged in, redirect to login
        if (!$user) {
            return redirect('/login');
        }
        
        // If email is already verified, allow access
        if ($user->email_verified_at !== null) {
            return $next($request);
        }
        
        // Staff roles created by admin are pre-verified - allow access
        $staffRoles = ['doctor', 'medtech', 'radtech', 'admin' , 'company' ,];
        if (in_array($user->role, $staffRoles)) {
            return $next($request);
        }
        
        // For regular users who are not verified, show the verification notice
        return redirect()->route('verification.notice');
    }
}
