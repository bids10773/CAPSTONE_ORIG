<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->timestamp('arrived_at')->nullable()->index();
            $table->foreignId('checked_in_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('auto_cancelled_at')->nullable()->index();
            $table->text('cancellation_reason')->nullable();
            $table->foreignId('released_from_appointment_id')->nullable()->unique()
                ->constrained('appointments')->nullOnDelete();
            $table->timestamp('released_slot_assigned_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('checked_in_by');
            $table->dropConstrainedForeignId('released_from_appointment_id');
            $table->dropColumn([
                'arrived_at', 'auto_cancelled_at', 'cancellation_reason',
                'released_slot_assigned_at',
            ]);
        });
    }
};
