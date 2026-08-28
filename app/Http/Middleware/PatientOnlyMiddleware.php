<?php

namespace App\Http\Middleware;

use App\Support\RoleDashboard;
use Closure;
use Illuminate\Http\Request;

class PatientOnlyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()) {
            return $request->user()->role === 'patient'
                ? $next($request)
                : redirect(RoleDashboard::path($request->user()->role));
        }

        return $next($request);
    }
}
