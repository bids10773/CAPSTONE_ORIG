<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->index(['status', 'appointment_date'], 'appointments_status_date_index');
            $table->index(['type', 'appointment_date'], 'appointments_type_date_index');
            $table->index(['doctor_id', 'status', 'updated_at'], 'appointments_doctor_status_updated_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index(['role', 'is_active', 'created_at'], 'users_role_active_created_index');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->index(['status', 'company_name'], 'companies_status_name_index');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('appointments_status_date_index');
            $table->dropIndex('appointments_type_date_index');
            $table->dropIndex('appointments_doctor_status_updated_index');
        });

        Schema::table('users', fn (Blueprint $table) => $table->dropIndex('users_role_active_created_index'));
        Schema::table('companies', fn (Blueprint $table) => $table->dropIndex('companies_status_name_index'));
    }
};
