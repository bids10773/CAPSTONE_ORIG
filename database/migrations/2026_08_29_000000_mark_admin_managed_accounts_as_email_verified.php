<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereIn('role', [
                'doctor',
                'medtech',
                'radtech',
                'receptionist',
                'company',
            ])
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        // Verification predating this migration cannot be distinguished safely.
    }
};
