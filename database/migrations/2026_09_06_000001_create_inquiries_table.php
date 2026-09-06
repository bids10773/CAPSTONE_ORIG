<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('inquiries')) {
            return;
        }

        Schema::create('inquiries', function (Blueprint $table): void {
            $table->id();
            $table->uuid('submission_key')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('category', 50)->index();
            $table->string('sender_first_name', 100);
            $table->string('sender_middle_name', 100)->nullable();
            $table->string('sender_last_name', 100);
            $table->string('representative_position', 100)->nullable();
            $table->string('company_name')->nullable();
            $table->string('email');
            $table->string('contact_number', 30)->nullable();
            $table->string('subject', 150);
            $table->text('message');
            $table->string('status', 20)->default('pending')->index();
            $table->foreignId('responded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('response')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->foreignId('converted_company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'created_at'], 'inquiries_status_created_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};
