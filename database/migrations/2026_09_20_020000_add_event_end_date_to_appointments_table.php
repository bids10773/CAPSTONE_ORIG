<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->date('event_end_date')->nullable()->after('appointment_date');
        });

        DB::table('appointments')
            ->where('type', 'company_bulk')
            ->whereNull('event_end_date')
            ->update(['event_end_date' => DB::raw('DATE(appointment_date)')]);
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->dropColumn('event_end_date');
        });
    }
};
