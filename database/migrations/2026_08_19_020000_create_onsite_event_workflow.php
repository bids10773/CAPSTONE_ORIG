<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('attendance_status', 20)->nullable()->after('expected_employee_count')->index();
            $table->foreignId('attendance_marked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('attendance_marked_at')->nullable();
            $table->string('absence_reason', 50)->nullable();
            $table->string('absence_details', 500)->nullable();
            $table->string('onsite_event_status', 40)->nullable()->index();
        });

        Schema::create('onsite_event_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulk_appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('service_role', 20);
            $table->unsignedSmallInteger('queue_capacity')->default(10);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['bulk_appointment_id', 'user_id', 'service_role']);
        });

        Schema::create('onsite_service_queues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulk_appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->string('service_role', 20);
            $table->foreignId('assigned_staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('waiting')->index();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('hold_reason', 500)->nullable();
            $table->timestamps();
            $table->unique(['appointment_id', 'service_role']);
            $table->index(['bulk_appointment_id', 'service_role', 'status'], 'onsite_queue_event_role_status');
            $table->index(['assigned_staff_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onsite_service_queues');
        Schema::dropIfExists('onsite_event_staff');
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('attendance_marked_by');
            $table->dropColumn(['attendance_status', 'attendance_marked_at', 'absence_reason', 'absence_details', 'onsite_event_status']);
        });
    }
};
