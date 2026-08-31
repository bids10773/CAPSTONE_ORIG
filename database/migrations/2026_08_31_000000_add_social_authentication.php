<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->change();
        });

        Schema::table('patient_profiles', function (Blueprint $table) {
            $table->date('birthdate')->nullable()->change();
            $table->string('sex')->nullable()->change();
            $table->string('civil_status')->nullable()->change();
            $table->text('address')->nullable()->after('civil_status');
        });

        Schema::create('social_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 32);
            $table->string('provider_user_id');
            $table->timestamps();

            $table->unique(['provider', 'provider_user_id']);
            $table->unique(['user_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_accounts');

        Schema::table('patient_profiles', function (Blueprint $table) {
            $table->dropColumn('address');
            $table->date('birthdate')->nullable(false)->change();
            $table->string('sex')->nullable(false)->change();
            $table->string('civil_status')->nullable(false)->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable(false)->change();
        });
    }
};
