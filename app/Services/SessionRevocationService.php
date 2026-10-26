<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SessionRevocationService
{
    public function revoke(User $user, ?string $exceptSessionId = null): void
    {
        $user->forceFill(['remember_token' => Str::random(60)])->save();

        if (config('session.driver') === 'database') {
            DB::connection(config('session.connection'))
                ->table(config('session.table', 'sessions'))
                ->where('user_id', $user->getAuthIdentifier())
                ->when($exceptSessionId !== null, fn ($query) => $query->where('id', '!=', $exceptSessionId))
                ->delete();
        }
    }
}
