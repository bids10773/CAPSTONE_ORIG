<?php

use App\Models\PatientProfile;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('patient_profiles')
            ->join('users', 'users.id', '=', 'patient_profiles.user_id')
            ->join('companies', 'companies.id', '=', 'users.company_id')
            ->select('patient_profiles.id', 'patient_profiles.user_id', 'companies.company_name')
            ->where(function ($query): void {
                $query->whereNull('patient_profiles.employee_number')
                    ->orWhere('patient_profiles.employee_number', '');
            })
            ->where('users.role', 'patient')
            ->orderBy('patient_profiles.id')
            ->chunkById(500, function ($profiles): void {
                foreach ($profiles as $profile) {
                    DB::table('patient_profiles')
                        ->where('id', $profile->id)
                        ->update([
                            'employee_number' => PatientProfile::generatedEmployeeNumber(
                                (int) $profile->user_id,
                                $profile->company_name
                            ),
                        ]);
                }
            }, 'patient_profiles.id', 'id');
    }

    public function down(): void
    {
        // Generated identifiers are retained because they may already appear
        // in medical records and exported company reports.
    }
};
