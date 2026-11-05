<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vital_signs', fn (Blueprint $table) => $table->json('not_assessed')->nullable());
        Schema::table('physical_exams', fn (Blueprint $table) => $table->json('vital_signs_not_assessed')->nullable());
    }

    public function down(): void
    {
        Schema::table('physical_exams', fn (Blueprint $table) => $table->dropColumn('vital_signs_not_assessed'));
        Schema::table('vital_signs', fn (Blueprint $table) => $table->dropColumn('not_assessed'));
    }
};
