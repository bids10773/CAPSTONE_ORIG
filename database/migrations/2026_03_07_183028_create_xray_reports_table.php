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
        Schema::create('xray_reports', function (Blueprint $table) {

            $table->id();

            $table->foreignId('appointment_id')->constrained();

            $table->text('findings')->nullable();     // ✅ allow normal case
            $table->text('impression')->nullable();   // ✅ allow normal case

            $table->foreignId('radiologist_id')->constrained('users');

            // ❌ REMOVED: view column

            $table->boolean('is_completed')->default(false); // ✅ optional but recommended

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('xray_reports');
    }
};