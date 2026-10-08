<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_management_settings', function (Blueprint $table): void {
            $table->id();
            $table->unsignedSmallInteger('retention_years')->default(7);
            $table->unsignedSmallInteger('inactivity_months')->default(60);
            $table->boolean('scheduled_backups_enabled')->default(true);
            $table->unsignedSmallInteger('backup_interval_months')->default(6);
            $table->boolean('automatic_deletion_enabled')->default(false);
            $table->timestamps();
        });

        Schema::create('data_backups', function (Blueprint $table): void {
            $table->id();
            $table->string('filename');
            $table->string('disk')->default('local');
            $table->string('type', 20)->index();
            $table->string('status', 20)->index();
            $table->json('included_data')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->string('checksum_sha256', 64)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable()->index();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->timestamp('retention_anonymized_at')->nullable()->index()->after('last_active_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('retention_anonymized_at');
        });
        Schema::dropIfExists('data_backups');
        Schema::dropIfExists('data_management_settings');
    }
};
