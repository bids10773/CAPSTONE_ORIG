<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_referrals', function (Blueprint $table) {
            $table->date('birthdate')->nullable()->change();
            $table->enum('sex', ['Male', 'Female'])->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('company_referrals', function (Blueprint $table) {
            $table->date('birthdate')->nullable(false)->change();
            $table->enum('sex', ['Male', 'Female'])->nullable(false)->change();
        });
    }
};
