<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->must_change_password) {
            return $next($request);
        }

        if ($user->temporary_password_expires_at?->isPast()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->with('error', 'Your temporary password has expired. Ask an administrator to resend your credentials.');
        }

        if ($request->routeIs('temporary-password.*', 'logout')) {
            return $next($request);
        }

        return redirect()->route('temporary-password.edit');
    }
}
