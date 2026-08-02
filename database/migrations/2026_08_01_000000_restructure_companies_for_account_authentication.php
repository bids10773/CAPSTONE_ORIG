<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->renameColumn('name', 'company_name');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->string('email')->nullable()->after('company_name');
            $table->string('contact_number', 30)->nullable()->after('email');
            $table->string('industry_type', 100)->nullable()->after('address');
            $table->string('logo_path')->nullable()->after('industry_type');
            $table->unique('company_name');
            $table->unique('email');
        });

        DB::table('companies')->orderBy('id')->each(function (object $company): void {
            $login = DB::table('users')
                ->where('company_id', $company->id)
                ->where('role', 'company')
                ->first();

            DB::table('companies')->where('id', $company->id)->update([
                'email' => $company->representative_email ?? $login?->email,
                'contact_number' => $company->representative_contact ?? $login?->contact,
            ]);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'representative_name',
                'representative_email',
                'representative_contact',
                'temp_password',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('representative_name')->nullable();
            $table->string('representative_email')->nullable();
            $table->string('representative_contact')->nullable();
            $table->string('temp_password')->nullable();
            $table->dropUnique(['company_name']);
            $table->dropUnique(['email']);
            $table->dropColumn(['email', 'contact_number', 'industry_type', 'logo_path']);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->renameColumn('company_name', 'name');
        });
    }
};
