<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('license_verification_status')->default('not_submitted')->after('license_no');
            $table->string('license_document_path')->nullable()->after('license_verification_status');
            $table->timestamp('license_verified_at')->nullable()->after('license_document_path');
            $table->foreignId('license_verified_by')->nullable()->after('license_verified_at')->constrained('users')->nullOnDelete();
            $table->text('license_rejection_reason')->nullable()->after('license_verified_by');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['license_verified_by']);
            $table->dropColumn([
                'license_verification_status',
                'license_document_path',
                'license_verified_at',
                'license_verified_by',
                'license_rejection_reason',
            ]);
        });
    }
};
