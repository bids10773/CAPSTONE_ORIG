<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\MedicalExamination;
use Illuminate\Support\Facades\DB;

class MedicalExaminationService
{
    public function forAppointment(Appointment $appointment): MedicalExamination
    {
        return DB::transaction(function () use ($appointment): MedicalExamination {
            $examination = MedicalExamination::query()->firstOrCreate(
                ['appointment_id' => $appointment->id],
                [
                    'examining_doctor_id' => $appointment->doctor_id,
                    'examination_date' => $appointment->appointment_date?->toDateString(),
                    'company_id' => $appointment->company_id,
                    'batch_id' => $appointment->batch_id,
                    'status' => 'for_physical_examination',
                ],
            );

            foreach (app(LaboratoryFormDefinition::class)->sectionsFor($appointment) as $key => $definition) {
                $examination->diagnosticResults()->firstOrCreate(['service_key' => $key], [
                    'appointment_id' => $appointment->id,
                    'patient_id' => $appointment->user_id,
                    'company_id' => $appointment->company_id,
                    'batch_id' => $appointment->batch_id,
                    'status' => 'pending',
                ]);
            }

            return $examination;
        });
    }
}
