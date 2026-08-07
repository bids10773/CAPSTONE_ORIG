<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\MedicalExamination;

class MedicalExaminationService
{
    public function forAppointment(Appointment $appointment): MedicalExamination
    {
        return MedicalExamination::query()->firstOrCreate(
            ['appointment_id' => $appointment->id],
            [
                'examining_doctor_id' => $appointment->doctor_id,
                'examination_date' => $appointment->appointment_date?->toDateString(),
                'status' => 'in_progress',
            ],
        );
    }
}
