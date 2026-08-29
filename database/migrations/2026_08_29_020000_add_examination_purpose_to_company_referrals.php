<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_referrals', function (Blueprint $table) {
            $table->string('examination_purpose', 40)->default('annual_pe')->after('required_services');
        });
    }

    public function down(): void
    {
        Schema::table('company_referrals', function (Blueprint $table) {
            $table->dropColumn('examination_purpose');
        });
    }
};
