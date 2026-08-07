<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_examinations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('examining_doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('examination_date')->nullable()->index();
            $table->string('status', 30)->default('in_progress')->index();
            $table->string('medical_classification', 30)->nullable();
            $table->boolean('fit_to_work')->nullable();
            $table->text('final_diagnosis')->nullable();
            $table->text('final_remarks')->nullable();
            $table->foreignId('finalized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();
        });

        foreach (['physical_exams', 'lab_results', 'xray_reports', 'medical_history'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('medical_examination_id')->nullable()->after('appointment_id')
                    ->constrained('medical_examinations')->cascadeOnDelete();
            });
        }

        DB::table('appointments')->orderBy('id')->each(function (object $appointment): void {
            $physical = DB::table('physical_exams')->where('appointment_id', $appointment->id)->first();
            $examinationId = DB::table('medical_examinations')->insertGetId([
                'appointment_id' => $appointment->id,
                'examining_doctor_id' => $physical?->doctor_id ?? $appointment->doctor_id,
                'examination_date' => substr((string) $appointment->appointment_date, 0, 10),
                'status' => $appointment->status === 'completed' ? 'finalized' : 'in_progress',
                'medical_classification' => $physical?->classification !== 'Pending' ? $physical?->classification : null,
                'fit_to_work' => match ($physical?->classification) {
                    'Class A', 'Class B' => true,
                    'Unfit' => false,
                    default => null,
                },
                'final_remarks' => $physical?->doctor_remarks,
                'finalized_by' => $physical?->finalized_by,
                'finalized_at' => $physical?->finalized_at,
                'created_at' => $appointment->created_at,
                'updated_at' => $appointment->updated_at,
            ]);

            foreach (['physical_exams', 'lab_results', 'xray_reports', 'medical_history'] as $tableName) {
                DB::table($tableName)->where('appointment_id', $appointment->id)
                    ->update(['medical_examination_id' => $examinationId]);
            }
        });
    }

    public function down(): void
    {
        foreach (['medical_history', 'xray_reports', 'lab_results', 'physical_exams'] as $tableName) {
            Schema::table($tableName, fn (Blueprint $table) => $table->dropConstrainedForeignId('medical_examination_id'));
        }

        Schema::dropIfExists('medical_examinations');
    }
};
