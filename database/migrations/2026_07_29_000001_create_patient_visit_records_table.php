<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_visit_records', function (Blueprint $table) {
            $table->id();
            $table->date('record_month')->unique();
            $table->unsignedInteger('walk_in');
            $table->unsignedInteger('online_appointments');
            $table->unsignedInteger('company_referrals');
            $table->unsignedInteger('ape');
            $table->unsignedInteger('follow_up');
            $table->unsignedInteger('emergency_walk_ins')->default(0);
            $table->boolean('is_demo')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_visit_records');
    }
};
