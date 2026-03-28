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
            $table->foreignId('appointment_id')->constrained()->onDelete('cascade');
            $table->foreignId('encoded_by')->constrained('users');

            // --- Section A: CBC ---
            $table->string('cbc_status')->default('normal'); // 'normal' or 'findings'
            $table->text('cbc_findings')->nullable();

            // --- Section B: Urinalysis ---
            $table->string('urinalysis_status')->default('normal');
            $table->text('urinalysis_findings')->nullable();

            // --- Section C: Fecalysis ---
            $table->string('fecalysis_status')->default('normal');
            $table->text('fecalysis_findings')->nullable();

            // --- Section D-F: Rapid Tests ---
            $table->string('hepa_b_status')->default('non-reactive');
            $table->string('hepa_a_status')->default('non-reactive');
            $table->string('pregnancy_test')->default('negative');

            // --- Section G: Drug Test ---
            $table->string('meth_status')->default('negative');
            $table->string('marijuana_status')->default('negative');

            // --- Final Remarks ---
            $table->text('remarks')->nullable();

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