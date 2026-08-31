<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePatientProfileIsComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->role === 'patient'
            && $user->socialAccounts()->exists()
            && ! $user->hasCompletePatientProfile()) {
            return redirect()->route('patient-profile.complete')
                ->with('error', 'Please complete your patient profile before booking an appointment.');
        }

        return $next($request);
    }
}
