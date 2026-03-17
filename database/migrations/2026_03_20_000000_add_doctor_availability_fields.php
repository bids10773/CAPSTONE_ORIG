<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('availability')->nullable()->after('specialization');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('doctor_id')->nullable()->constrained('users')->after('company_id');
            $table->time('start_time')->nullable()->after('doctor_id');
            $table->time('end_time')->nullable()->after('start_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('availability');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['doctor_id']);
            $table->dropColumn(['doctor_id', 'start_time', 'end_time']);
        });
    }
};

