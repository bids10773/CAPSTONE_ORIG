<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diagnostic_results', function (Blueprint $table) {
            $table->foreignId('sent_for_verification_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('sent_for_verification_at')->nullable()->index();
        });
        Schema::table('xray_reports', function (Blueprint $table) {
            $table->foreignId('sent_for_verification_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('sent_for_verification_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('diagnostic_results', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sent_for_verification_by');
            $table->dropColumn('sent_for_verification_at');
        });
        Schema::table('xray_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sent_for_verification_by');
            $table->dropColumn('sent_for_verification_at');
        });
    }
};
