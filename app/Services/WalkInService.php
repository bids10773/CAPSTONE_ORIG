<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\PatientProfile;
use App\Models\User;
use App\Support\PhilippineContactNumber;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class WalkInService
{
    /** @param array<string, mixed> $data */
    public function create(array $data, User $staff): Appointment
    {
        return DB::transaction(function () use ($data, $staff): Appointment {
            $patient = $data['patient_type'] === 'existing'
                ? User::query()->where('role', 'patient')->where('is_active', true)->findOrFail($data['user_id'])
                : $this->registerPatient($data);

            return Appointment::create([
                'user_id' => $patient->id,
                'appointment_date' => now(),
                'type' => 'walk_in',
                'status' => 'pending',
                'arrived_at' => now(),
                'checked_in_by' => $staff->id,
                'service_types' => $data['service_types'],
                'notes' => $data['notes'] ?? null,
            ]);
        });
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
