<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {

    $table->id();

    $table->foreignId('user_id')->constrained();

    $table->foreignId('company_id')->nullable()->constrained();

    $table->dateTime('appointment_date');

    $table->enum('type', [
    'individual',
    'company_referral',
    'company_bulk',
    'walk_in'
]);

$table->enum('status', [
    'pending',
    'accepted',
    'arrived',
    'for_diagnostics',
    'for_xray',
    'for_final_evaluation',
    'completed',
    'cancelled'
]);

    $table->timestamps();

});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
