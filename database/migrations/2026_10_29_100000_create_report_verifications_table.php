<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_verifications', function (Blueprint $table): void {
            $table->id();
            $table->string('source_type', 30);
            $table->unsignedBigInteger('source_id');
            $table->string('token', 64)->unique();
            $table->timestamps();
            $table->unique(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_verifications');
    }
};
