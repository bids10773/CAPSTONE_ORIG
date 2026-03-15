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
        Schema::table('users', function (Blueprint $table) {

    $table->string('role')->default('patient');

    $table->string('license_no')->nullable();
    $table->string('specialization')->nullable();

    $table->string('signature_path')->nullable();

    $table->unsignedBigInteger('company_id')->nullable();

    $table->boolean('is_active')->default(true);

});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
