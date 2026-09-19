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
            ->select('patient_profiles.id', 'patient_profiles.user_id', 'patient_profiles.employee_number', 'companies.company_name')
            ->where('users.role', 'patient')
            ->where('patient_profiles.employee_number', 'like', 'BLK-%')
            ->orderBy('patient_profiles.id')
            ->chunkById(500, function ($profiles): void {
                foreach ($profiles as $profile) {
                    $oldGeneratedNumber = 'BLK-'.str_pad((string) $profile->user_id, 6, '0', STR_PAD_LEFT);

                    if ($profile->employee_number !== $oldGeneratedNumber) {
                        continue;
                    }

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
        // Company-based identifiers are retained once issued.
    }
};
