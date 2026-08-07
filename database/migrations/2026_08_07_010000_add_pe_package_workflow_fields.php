<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medical_examinations', function (Blueprint $table) {
            $table->text('recommendations')->nullable()->after('final_remarks');
        });

        Schema::table('physical_exams', function (Blueprint $table) {
            $table->unsignedSmallInteger('respiration_rate')->nullable()->after('pulse_rate');
            $table->string('visual_acuity', 100)->nullable()->after('temperature');
            $table->string('hearing', 100)->nullable()->after('visual_acuity');
        });

        Schema::table('xray_reports', function (Blueprint $table) {
            $table->string('status', 40)->default('pending')->index();
            $table->timestamp('performed_at')->nullable();
            $table->timestamp('result_available_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('recommendation')->nullable();
            $table->text('remarks')->nullable();
        });

        DB::table('xray_reports')->where('is_completed', true)->update([
            'status' => 'completed',
            'performed_at' => DB::raw('created_at'),
            'result_available_at' => DB::raw('updated_at'),
            'verified_by' => DB::raw('COALESCE(finalized_by, radiologist_id)'),
            'verified_at' => DB::raw('COALESCE(finalized_at, updated_at)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('medical_examinations', fn (Blueprint $table) => $table->dropColumn('recommendations'));

        Schema::table('xray_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verified_by');
            $table->dropColumn([
                'status', 'performed_at', 'result_available_at', 'verified_at',
                'recommendation', 'remarks',
            ]);
        });

        Schema::table('physical_exams', fn (Blueprint $table) => $table->dropColumn([
            'respiration_rate', 'visual_acuity', 'hearing',
        ]));
    }
};
