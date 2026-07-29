<?php

namespace Database\Seeders;

use App\Models\PatientVisitRecord;
use App\Services\DemoPatientVisitGenerator;
use Illuminate\Database\Seeder;

class DemoPatientVisitSeeder extends Seeder
{
    public function run(): void
    {
        foreach (app(DemoPatientVisitGenerator::class)->generate() as $row) {
            PatientVisitRecord::query()->updateOrCreate(
                ['record_month' => "{$row['month']}-01"],
                [
                    ...collect($row)->except(['month', 'total_visits'])->all(),
                    'is_demo' => true,
                ],
            );
        }
    }
}
