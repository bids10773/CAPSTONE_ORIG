<?php

namespace App\Actions\Fortify;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Fortify\Fortify;

class NormalizeLoginEmail
{
    public function handle(Request $request, Closure $next): mixed
    {
        $request->merge([
            Fortify::username() => Str::lower(trim((string) $request->input(Fortify::username()))),
        ]);

        return $next($request);
    }
}
