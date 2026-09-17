<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\PatientProfile;
use App\Models\User;
use App\Support\PhilippineContactNumber;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WalkInService
{
    public function __construct(private readonly WalkInDoctorSlotService $doctorSlots) {}

    /** @param array<string, mixed> $data */
    public function create(array $data, User $staff): Appointment
    {
        if (now()->isWeekend()) {
            throw ValidationException::withMessages([
                'appointment_date' => 'Walk-ins are available Monday through Friday only because the clinic is closed on weekends.',
            ]);
        }

        if ($data['examination_purpose'] === 'pre_employment') {
            $data['service_types'] = collect(config('medical.pe_package.pre_employment_services', []))
                ->merge($data['service_types'])
                ->unique()
                ->values()
                ->all();
        }

        return DB::transaction(function () use ($data, $staff): Appointment {
            $doctor = null;
            if (! empty($data['doctor_id'])) {
                $doctor = User::query()->whereKey($data['doctor_id'])->lockForUpdate()->firstOrFail();
                $this->doctorSlots->assertAvailable($doctor, $data['start_time']);
            }

            $patient = $data['patient_type'] === 'existing'
                ? User::query()->where('role', 'patient')->where('is_active', true)->findOrFail($data['user_id'])
                : $this->registerPatient($data);

            return Appointment::create([
                'user_id' => $patient->id,
                'doctor_id' => $doctor?->id,
                'start_time' => $doctor ? $data['start_time'] : null,
                'end_time' => $doctor ? \Illuminate\Support\Carbon::parse($data['start_time'])->addMinutes((int) config('medical.clinic_hours.slot_minutes', 30))->format('H:i') : null,
                'appointment_date' => now(),
                'type' => 'walk_in',
                'status' => 'pending',
                'arrived_at' => now(),
                'checked_in_by' => $staff->id,
                'examination_purpose' => $data['examination_purpose'],
                'service_types' => $data['service_types'],
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    public function assignDoctor(Appointment $appointment, int $doctorId, string $startTime): Appointment
    {
        return DB::transaction(function () use ($appointment, $doctorId, $startTime): Appointment {
            $doctor = User::query()->whereKey($doctorId)->lockForUpdate()->firstOrFail();
            $locked = Appointment::query()->whereKey($appointment->id)->lockForUpdate()->firstOrFail();
            if ($locked->type !== 'walk_in' || ! in_array($locked->status, ['pending', 'arrived'], true)
                || $locked->start_time !== null || $locked->doctor_id !== null) {
                throw ValidationException::withMessages([
                    'doctor_id' => 'Only an unassigned waiting walk-in can receive a doctor and time.',
                ]);
            }

            $this->doctorSlots->assertAvailable($doctor, $startTime);
            $locked->update([
                'doctor_id' => $doctor->id,
                'start_time' => $startTime,
                'end_time' => \Illuminate\Support\Carbon::parse($startTime)
                    ->addMinutes((int) config('medical.clinic_hours.slot_minutes', 30))->format('H:i'),
            ]);

            return $locked;
        }, 3);
    }

    /** @param array<string, mixed> $data */
    private function registerPatient(array $data): User
    {
        $patient = User::create([
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'email' => $data['email'] ?? null,
            'contact' => PhilippineContactNumber::normalize($data['contact'] ?? null) ?? ($data['contact'] ?? null),
            'password' => Hash::make(Str::random(40)),
            'role' => 'patient',
            'is_active' => true,
        ]);

        PatientProfile::create([
            'user_id' => $patient->id,
            'birthdate' => $data['birthdate'] ?? null,
            'sex' => $data['sex'] ?? null,
            'civil_status' => $data['civil_status'] ?? null,
        ]);

        return $patient;
    }
}
