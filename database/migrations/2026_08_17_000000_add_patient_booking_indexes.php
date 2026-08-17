<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->index(['user_id', 'type', 'appointment_date', 'status'], 'appointments_patient_booking_index');
        });

        Schema::table('security_audits', function (Blueprint $table) {
            $table->index(['target_user_id', 'action', 'created_at'], 'security_audits_target_action_created_index');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', fn (Blueprint $table) => $table->dropIndex('appointments_patient_booking_index'));
        Schema::table('security_audits', fn (Blueprint $table) => $table->dropIndex('security_audits_target_action_created_index'));
    }
};
