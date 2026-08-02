<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_profiles', function (Blueprint $table) {
            $table->string('employee_number', 80)->nullable()->index();
        });

        Schema::table('lab_results', function (Blueprint $table) {
            $table->json('cbc_results')->nullable();
            $table->json('urinalysis_results')->nullable();
            $table->json('fecalysis_results')->nullable();
            $table->json('drug_test_results')->nullable();
            $table->json('serology_results')->nullable();
            $table->json('blood_chemistry_results')->nullable();
            $table->string('blood_type', 10)->nullable();
            $table->string('pregnancy_test', 30)->nullable()->change();
            $table->string('status', 20)->default('draft')->index();
            $table->boolean('is_completed')->default(false)->index();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('finalized_at')->nullable();
            $table->unique('appointment_id');
        });

        Schema::table('physical_exams', function (Blueprint $table) {
            $table->boolean('is_completed')->default(false)->index();
            $table->foreignId('finalized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('finalized_at')->nullable();
            $table->unique('appointment_id');
        });

        Schema::table('xray_reports', function (Blueprint $table) {
            $table->foreignId('finalized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('finalized_at')->nullable();
            $table->unique('appointment_id');
        });

        Schema::table('medical_history', function (Blueprint $table) {
            $table->unique('appointment_id');
        });

        Schema::create('clinical_form_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('form_type', 40)->index();
            $table->string('action', 30)->index();
            $table->json('changes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinical_form_audits');
        Schema::table('medical_history', fn (Blueprint $table) => $table->dropUnique(['appointment_id']));
        Schema::table('xray_reports', function (Blueprint $table) {
            $table->dropUnique(['appointment_id']);
            $table->dropConstrainedForeignId('finalized_by');
            $table->dropColumn('finalized_at');
        });
        Schema::table('physical_exams', function (Blueprint $table) {
            $table->dropUnique(['appointment_id']);
            $table->dropConstrainedForeignId('finalized_by');
            $table->dropColumn(['is_completed', 'finalized_at']);
        });
        Schema::table('lab_results', function (Blueprint $table) {
            $table->dropUnique(['appointment_id']);
            $table->dropConstrainedForeignId('verified_by');
            $table->dropColumn([
                'cbc_results', 'urinalysis_results', 'fecalysis_results',
                'drug_test_results', 'serology_results', 'blood_chemistry_results',
                'blood_type', 'status', 'is_completed', 'finalized_at',
            ]);
        });
        Schema::table('patient_profiles', fn (Blueprint $table) => $table->dropColumn('employee_number'));
    }
};
