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
    Schema::table('appointments', function (Blueprint $table) {
        // We change it to string so it never blocks our code again
        $table->string('status')->default('pending')->change();
    });
}

public function down(): void
{
    Schema::table('appointments', function (Blueprint $table) {
        $table->enum('status', ['pending', 'arrived', 'completed', 'cancelled'])->change();
    });
}
};
