<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_documents', function (Blueprint $table) {
            $table->id();
            $table->string('document_number', 40)->unique();
            $table->string('source_key', 100)->unique();
            $table->string('source_type', 40);
            $table->unsignedBigInteger('source_id');
            $table->foreignId('patient_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('medical_certificate_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('ready_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('released_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('document_type', 50)->index();
            $table->string('title');
            $table->string('related_service')->nullable();
            $table->string('status', 30)->default('pending')->index();
            $table->text('release_instructions')->nullable();
            $table->timestamp('requested_at')->nullable()->index();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('released_at')->nullable()->index();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['patient_id', 'status']);
            $table->index(['source_type', 'source_id']);
        });

        Schema::create('medical_document_releases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medical_document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('released_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('recipient_type', 40);
            $table->string('recipient_name')->nullable();
            $table->text('representative_verification')->nullable();
            $table->string('release_method', 50);
            $table->text('remarks')->nullable();
            $table->timestamp('released_at')->index();
            $table->foreignId('reversed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reversed_at')->nullable();
            $table->text('reversal_reason')->nullable();
            $table->timestamps();

            $table->index(['medical_document_id', 'released_at']);
        });

        Schema::create('medical_document_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medical_document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 50)->index();
            $table->string('old_status', 30)->nullable();
            $table->string('new_status', 30)->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['medical_document_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_document_audits');
        Schema::dropIfExists('medical_document_releases');
        Schema::dropIfExists('medical_documents');
    }
};
