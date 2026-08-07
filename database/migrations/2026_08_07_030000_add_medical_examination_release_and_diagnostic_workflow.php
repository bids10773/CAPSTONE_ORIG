<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medical_examinations', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('batch_id')->nullable()->index();
            $table->foreignId('released_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('released_at')->nullable()->index();
        });

        Schema::create('diagnostic_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medical_examination_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('batch_id')->nullable()->index();
            $table->string('service_key', 50);
            $table->string('status', 40)->default('pending')->index();
            $table->json('result_data')->nullable();
            $table->text('findings')->nullable();
            $table->text('remarks')->nullable();
            $table->string('official_reference_number', 100)->nullable();
            $table->date('official_result_date')->nullable();
            $table->string('supporting_document_path')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('performed_at')->nullable();
            $table->foreignId('encoded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('encoded_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->unique(['medical_examination_id', 'service_key']);
            $table->index(['appointment_id', 'service_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_results');
        Schema::table('medical_examinations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
            $table->dropConstrainedForeignId('released_by');
            $table->dropColumn(['batch_id', 'released_at']);
        });
    }
};
