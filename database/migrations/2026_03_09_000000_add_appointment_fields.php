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
        Schema::table('appointments', function (Blueprint $table) {
            // Add service type for the appointment
            $table->json('service_types')->nullable()->after('company_id');
            
            // Add referral code for company referrals
            $table->string('referral_code')->nullable()->after('service_type');
            
            // Add notes field
            $table->text('notes')->nullable()->after('referral_code');
            
            // Add bulk batch identifier for company bulk bookings
            $table->string('batch_id')->nullable()->after('notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'service_type',
                'referral_code',
                'notes',
                'batch_id',
            ]);
        });
    }
};

