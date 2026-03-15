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

    $table->text('findings');

    $table->text('impression');

    $table->foreignId('radiologist_id')->constrained('users');

    $table->string('view')->default('Chest PA');

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
