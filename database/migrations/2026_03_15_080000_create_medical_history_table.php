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
        Schema::create('medical_history', function (Blueprint $table) {
            $table->id();
$table->foreignId('appointment_id')->constrained()->onDelete('cascade');
            $table->text('present_illness')->nullable(); 
            $table->text('past_medical_history')->nullable(); 
            $table->text('operations_accidents')->nullable(); 
            $table->text('family_history')->nullable(); 
            $table->text('allergies')->nullable(); 
            $table->text('personal_social_history')->nullable(); 
            $table->text('ob_menstrual_history')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_history');
    }
};

