<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_certificates', function (Blueprint $table) {
            $table->id();
            $table->string('certificate_number', 32)->unique();
            $table->unsignedSmallInteger('sequence_year');
            $table->unsignedInteger('sequence_number');

            $table->foreignId('patient_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('attending_physician_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('salutation', 20);
            $table->string('patient_name');
            $table->string('patient_reference_code', 32)->nullable();
            $table->unsignedSmallInteger('patient_age')->nullable();
            $table->string('patient_sex', 30)->nullable();
            $table->string('patient_civil_status', 50)->nullable();
            $table->date('consultation_date');
            $table->text('reason_for_consultation')->nullable();
            $table->text('clinical_impression')->nullable();
            $table->text('recommendation')->nullable();
            $table->date('rest_start_date')->nullable();
            $table->date('rest_end_date')->nullable();
            $table->date('date_issued')->nullable();
            $table->string('physician_name');
            $table->string('physician_license_no', 100)->nullable();

            $table->string('status', 30)->default('draft')->index();
            $table->text('approval_notes')->nullable();
            $table->text('change_request_reason')->nullable();
            $table->text('void_reason')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('issued_at')->nullable()->index();
            $table->timestamp('voided_at')->nullable();
            $table->timestamps();

            $table->unique(['sequence_year', 'sequence_number'], 'medical_certificates_year_sequence_unique');
            $table->index(['patient_id', 'consultation_date']);
            $table->index(['attending_physician_id', 'status']);
            $table->index(['date_issued', 'status']);
        });

        Schema::create('medical_certificate_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medical_certificate_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 40)->index();
            $table->string('old_status', 30)->nullable();
            $table->string('new_status', 30)->nullable();
            $table->json('changes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['medical_certificate_id', 'created_at'], 'medical_certificate_audits_certificate_created_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_certificate_audits');
        Schema::dropIfExists('medical_certificates');
    }
};
