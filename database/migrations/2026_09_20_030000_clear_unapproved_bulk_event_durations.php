<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $pendingParentIds = DB::table('appointments')
            ->where('type', 'company_bulk')
            ->whereNull('bulk_appointment_id')
            ->where('status', 'pending')
            ->pluck('id');

        DB::table('appointments')
            ->whereIn('id', $pendingParentIds)
            ->orWhereIn('bulk_appointment_id', $pendingParentIds)
            ->update(['event_end_date' => null]);
    }

    public function down(): void
    {
        // Pending requests remain undecided until the clinic approves them.
    }
};
