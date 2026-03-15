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
        Schema::create('lab_results', function (Blueprint $table) {

    $table->id();

    $table->foreignId('appointment_id')->constrained();

    $table->foreignId('encoded_by')->constrained('users');

    // CBC
    $table->decimal('hemoglobin',8,2)->nullable();
    $table->decimal('hematocrit',8,2)->nullable();
    $table->decimal('wbc_count',8,2)->nullable();
    $table->decimal('rbc_count',8,2)->nullable();
    $table->decimal('platelet',8,2)->nullable();

    // Urinalysis
    $table->string('uri_color')->nullable();
    $table->string('uri_transparency')->nullable();
    $table->decimal('uri_ph',3,1)->nullable();
    $table->decimal('uri_sp_gravity',4,3)->nullable();

    // Others
    $table->string('drug_test_shabu')->nullable();
    $table->string('hepa_b_sag')->nullable();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lab_results');
    }
};
