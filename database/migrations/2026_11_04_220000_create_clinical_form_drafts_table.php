<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinical_form_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->string('form_type', 40);
            $table->text('payload');
            $table->timestamps();
            $table->unique(['appointment_id', 'author_id', 'form_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinical_form_drafts');
    }
};
