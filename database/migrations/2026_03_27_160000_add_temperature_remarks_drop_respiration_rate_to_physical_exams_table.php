<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('physical_exams', function (Blueprint $table) {
            $table->decimal('temperature', 5, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->dropColumn('respiration_rate');
        });
    }

    public function down(): void
    {
        Schema::table('physical_exams', function (Blueprint $table) {
            $table->dropColumn(['temperature', 'remarks']);
            $table->integer('respiration_rate')->nullable();
        });
    }
};

