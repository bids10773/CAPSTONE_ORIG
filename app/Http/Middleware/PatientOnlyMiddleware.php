<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PatientOnlyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()) {
            return match($request->user()->role) {
                'admin'        => redirect('/admin/dashboard'),
                'doctor'       => redirect('/doctor/dashboard'),
                'medtech'      => redirect('/medtech/dashboard'),
                'radtech'      => redirect('/radtech/dashboard'),
                'company'      => redirect('/company/dashboard'),
                'receptionist' => redirect('/receptionist/dashboard'),
                default        => $next($request),
            };
        }

        return $next($request);
    }
}