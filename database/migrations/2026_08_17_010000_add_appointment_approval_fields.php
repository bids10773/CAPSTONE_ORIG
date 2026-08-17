<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('rejection_reason', 80)->nullable()->after('cancellation_reason');
            $table->text('rejection_details')->nullable()->after('rejection_reason');
            $table->foreignId('processed_by')->nullable()->after('rejection_details')->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable()->after('processed_by')->index();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('processed_by');
            $table->dropColumn(['rejection_reason', 'rejection_details', 'processed_at']);
        });
    }
};
