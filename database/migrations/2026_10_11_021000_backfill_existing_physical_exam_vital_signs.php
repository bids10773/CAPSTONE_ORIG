<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('physical_exams')
            ->join('appointments', 'appointments.id', '=', 'physical_exams.appointment_id')
            ->select([
                'physical_exams.*',
                'appointments.user_id as patient_id',
            ])
            ->orderBy('physical_exams.id')
            ->each(function (object $exam): void {
                if (DB::table('vital_signs')->where('appointment_id', $exam->appointment_id)->exists()) {
                    return;
                }

                preg_match('/^(\d{2,3})\s*\/\s*(\d{2,3})$/', (string) $exam->blood_pressure, $pressure);
                $height = $exam->height !== null ? (float) $exam->height : null;
                $weight = $exam->weight !== null ? (float) $exam->weight : null;
                $hasMeasurement = $height || $weight || $exam->blood_pressure || $exam->pulse_rate
                    || $exam->respiration_rate || $exam->temperature;
                if (! $hasMeasurement) {
                    return;
                }

                DB::table('vital_signs')->insert([
                    'patient_id' => $exam->patient_id,
                    'appointment_id' => $exam->appointment_id,
                    'medical_examination_id' => $exam->medical_examination_id,
                    'recorded_by' => $exam->doctor_id,
                    'submission_key' => (string) Str::uuid(),
                    'measurement_type' => 'legacy_import',
                    'systolic_pressure' => $pressure[1] ?? null,
                    'diastolic_pressure' => $pressure[2] ?? null,
                    'heart_rate' => $exam->pulse_rate,
                    'respiratory_rate' => $exam->respiration_rate,
                    'temperature' => $exam->temperature,
                    'oxygen_saturation' => null,
                    'height' => $height,
                    'weight' => $weight,
                    'bmi' => $height && $weight ? round($weight / (($height / 100) ** 2), 1) : null,
                    'notes' => 'Imported from the historical physical examination record.',
                    'measured_at' => $exam->created_at,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        DB::table('vital_signs')->where('measurement_type', 'legacy_import')
            ->where('notes', 'Imported from the historical physical examination record.')
            ->delete();
    }
};
