<?php

namespace App\Services;

use Carbon\CarbonImmutable;

class DemoPatientVisitGenerator
{
    /**
     * Deterministic demonstration data. Total excludes optional emergency visits.
     *
     * @return array<int, array<string, int|string|bool>>
     */
    public function generate(): array
    {
        $walkIn = [145, 138, 132, 125, 120, 148, 162, 170, 165, 156, 150, 158];
        $online = [70, 66, 62, 60, 58, 68, 74, 78, 76, 72, 75, 80];
        $company = [95, 88, 84, 78, 76, 82, 86, 90, 92, 96, 115, 125];
        $ape = [160, 150, 142, 82, 70, 76, 84, 90, 94, 105, 155, 175];
        $followUp = [45, 42, 40, 38, 37, 48, 55, 59, 57, 52, 50, 54];
        $emergency = [8, 7, 7, 6, 6, 10, 13, 15, 14, 12, 9, 10];
        $annualGrowth = [1.0, 1.028, 1.061, 1.098, 1.142];
        $records = [];
        $start = CarbonImmutable::parse('2021-01-01');

        for ($i = 0; $i < 60; $i++) {
            $year = intdiv($i, 12);
            $month = $i % 12;
            // Small deterministic variation avoids identical year shapes.
            $variation = 1 + (sin(($i + 2) * 1.73) * 0.018) + (cos(($i + 1) * 0.61) * 0.011);
            $category = fn (array $season, float $offset = 1.0): int => max(
                0,
                (int) round($season[$month] * $annualGrowth[$year] * $variation * $offset)
            );

            $row = [
                'month' => $start->addMonths($i)->format('Y-m'),
                'walk_in' => $category($walkIn),
                'online_appointments' => $category($online, 1 + ($year * 0.012)),
                'company_referrals' => $category($company),
                'ape' => $category($ape),
                'follow_up' => $category($followUp, 1 + ($year * 0.005)),
                'emergency_walk_ins' => $category($emergency),
                'is_demo' => true,
            ];
            $row['total_visits'] = $row['walk_in']
                + $row['online_appointments']
                + $row['company_referrals']
                + $row['ape']
                + $row['follow_up'];
            $records[] = $row;
        }

        return $records;
    }
}
