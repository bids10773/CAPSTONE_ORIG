<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->restrictOnDelete();
            $table->foreignId('patient_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('referral_number', 40)->unique();
            $table->string('invitation_token_hash', 64)->unique();
            $table->string('employee_email');
            $table->string('employee_contact', 30)->nullable();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->date('birthdate');
            $table->enum('sex', ['Male', 'Female']);
            $table->json('required_services');
            $table->date('valid_until');
            $table->string('status', 30)->default('pending')->index();
            $table->text('instructions')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();
            $table->index(['company_id', 'status', 'valid_until']);
            $table->index(['employee_email', 'birthdate']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('company_referral_id')
                ->nullable()
                ->after('bulk_appointment_id')
                ->unique()
                ->constrained('company_referrals')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', fn (Blueprint $table) => $table->dropConstrainedForeignId('company_referral_id'));
        Schema::dropIfExists('company_referrals');
    }
};
