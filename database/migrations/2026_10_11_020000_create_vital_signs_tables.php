<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vital_signs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('medical_examination_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('supersedes_id')->nullable()->constrained('vital_signs')->nullOnDelete();
            $table->uuid('submission_key')->unique();
            $table->string('measurement_type', 30)->default('initial');
            $table->unsignedSmallInteger('systolic_pressure')->nullable();
            $table->unsignedSmallInteger('diastolic_pressure')->nullable();
            $table->unsignedSmallInteger('heart_rate')->nullable();
            $table->unsignedSmallInteger('respiratory_rate')->nullable();
            $table->decimal('temperature', 4, 1)->nullable();
            $table->decimal('oxygen_saturation', 5, 2)->nullable();
            $table->decimal('height', 5, 1)->nullable();
            $table->decimal('weight', 6, 1)->nullable();
            $table->decimal('bmi', 5, 1)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('measured_at')->index();
            $table->timestamps();

            $table->index(['appointment_id', 'measured_at']);
            $table->index(['patient_id', 'measured_at']);
        });

        Schema::create('vital_sign_recheck_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('resolved_vital_sign_id')->nullable()->constrained('vital_signs')->nullOnDelete();
            $table->string('status', 20)->default('pending')->index();
            $table->text('reason');
            $table->timestamp('requested_at');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vital_sign_recheck_requests');
        Schema::dropIfExists('vital_signs');
    }
};
