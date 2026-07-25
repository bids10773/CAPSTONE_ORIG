<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->string('contact')->nullable()->change();
            $table->string('password')->nullable()->change();
        });

        Schema::table('patient_profiles', function (Blueprint $table) {
            $table->string('civil_status')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
            $table->string('contact')->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
        });

        Schema::table('patient_profiles', function (Blueprint $table) {
            $table->string('civil_status')->nullable(false)->change();
        });
    }
};
