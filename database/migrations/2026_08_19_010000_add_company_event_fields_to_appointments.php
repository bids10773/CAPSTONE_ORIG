<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('service_location', 20)->nullable()->after('bulk_appointment_id');
            $table->string('event_address', 500)->nullable()->after('service_location');
            $table->string('event_contact_name')->nullable()->after('event_address');
            $table->string('event_contact_number', 30)->nullable()->after('event_contact_name');
            $table->unsignedInteger('expected_employee_count')->nullable()->after('event_contact_number');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', fn (Blueprint $table) => $table->dropColumn([
            'service_location', 'event_address', 'event_contact_name',
            'event_contact_number', 'expected_employee_count',
        ]));
    }
};
