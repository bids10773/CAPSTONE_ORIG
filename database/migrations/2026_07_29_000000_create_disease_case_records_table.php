<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disease_case_records', function (Blueprint $table) {
            $table->id();
            $table->string('disease_name', 100);
            $table->date('record_month');
            $table->unsignedInteger('case_count');
            $table->timestamps();

            $table->unique(['disease_name', 'record_month']);
            $table->index('record_month');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disease_case_records');
    }
};
