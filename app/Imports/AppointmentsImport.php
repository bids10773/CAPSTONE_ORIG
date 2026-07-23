<?php

namespace App\Imports;

use App\Models\Appointment;
use App\Models\User;
use App\Models\PatientProfile;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Illuminate\Support\Facades\Hash;

class AppointmentsImport implements ToModel, WithHeadingRow, WithStartRow
{
    protected $companyId;
    protected $appointmentDate;

    public function __construct(int $companyId, string $appointmentDate)
    {
        $this->companyId = $companyId;
        $this->appointmentDate = $appointmentDate;
    }

    // Row 3 is the header, so data starts at row 4
    public function startRow(): int
    {
        return 3; // WithHeadingRow reads row 3 as header, data from row 4
    }

    public function model(array $row)
    {
        // Skip empty rows
        if (empty($row['first_name']) && empty($row['last_name'])) {
            return null;
        }

        // Normalize gender
        $gender = null;
        if (!empty($row['gender_fm_female_or_male'])) {
            $raw = strtoupper(trim($row['gender_fm_female_or_male']));
            $gender = match($raw) {
                'F', 'FEMALE' => 'Female',
                'M', 'MALE'   => 'Male',
                default        => null,
            };
        }

        // Find or create user
        $user = User::firstOrCreate(
            [
                'first_name' => trim($row['first_name']),
                'last_name'  => trim($row['last_name']),
            ],
            [
                'email'       => strtolower(trim($row['first_name'])) . '.' . strtolower(trim($row['last_name'])) . '.' . uniqid() . '@employee.com',
                'password'    => Hash::make('changeme123'),
                'role'        => 'patient',
                'is_active'   => true,
                'company_id'  => $this->companyId,
                'contact'     => !empty($row['contact']) ? trim($row['contact']) : null,
            ]
        );

        // Calculate age from birthdate
        $birthdate = !empty($row['birthdate']) ? \Carbon\Carbon::parse($row['birthdate']) : null;
        $age = $birthdate ? $birthdate->age : null;

        // Create or update patient profile
        PatientProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'birthdate'    => $birthdate,
                'age'          => $age,
                'sex'          => $gender,
                'civil_status' => !empty($row['civil_status']) ? strtolower(trim($row['civil_status'])) : null,
            ]
        );

        return new Appointment([
            'user_id'          => $user->id,
            'company_id'       => $this->companyId,
            'appointment_date' => $this->appointmentDate,
            'status'           => 'pending',
            'type'             => 'company_bulk',
        ]);
    }
}