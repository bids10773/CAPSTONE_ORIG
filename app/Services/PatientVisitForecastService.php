<?php

namespace App\Services;

use App\Models\PatientVisitRecord;
use Illuminate\Support\Facades\Cache;

class PatientVisitForecastService
{
    private const CATEGORIES = [
        'walk_in' => 'Walk-in Patients',
        'online_appointments' => 'Online Appointments',
        'company_referrals' => 'Company Referral Patients',
        'ape' => 'Annual Physical Examination (APE)',
        'follow_up' => 'Follow-up Visits',
        'emergency_walk_ins' => 'Emergency Walk-ins',
    ];

    public function __construct(
        private readonly DemoPatientVisitGenerator $generator,
        private readonly ForecastService $forecaster,
    ) {}

    /** @return array<string, mixed> */
    public function dashboard(?int $year = null, int $horizon = 12): array
    {
        return Cache::remember(
            "patient-visits:v1:{$year}:{$horizon}",
            now()->addMinutes(15),
            fn () => $this->build($year, $horizon),
        );
    }

    /** @return array<string, mixed> */
    private function build(?int $year, int $horizon): array
    {
        $records = PatientVisitRecord::query()->orderBy('record_month')->get();
        $isDemo = $records->isEmpty() || $records->every->is_demo;
        $history = $records->isEmpty()
            ? $this->generator->generate()
            : $records->map(function (PatientVisitRecord $row) {
                $data = [
                    'month' => $row->record_month->format('Y-m'),
                    ...collect($row->only(array_keys(self::CATEGORIES)))->map(fn ($value) => (int) $value)->all(),
                    'is_demo' => $row->is_demo,
                ];
                $data['total_visits'] = $data['walk_in']
                    + $data['online_appointments']
                    + $data['company_referrals']
                    + $data['ape']
                    + $data['follow_up'];

                return $data;
            })->all();

        $totalForecast = $this->forecaster->forecast(array_map(fn ($row) => [
            'month' => $row['month'],
            'cases' => $row['total_visits'],
        ], $history), $horizon);

        $categoryForecasts = [];
        foreach (self::CATEGORIES as $key => $label) {
            $categoryForecasts[$key] = [
                'label' => $label,
                'forecast' => $this->forecaster->forecast(array_map(fn ($row) => [
                    'month' => $row['month'],
                    'cases' => $row[$key],
                ], $history), $horizon)['forecast'],
            ];
        }

        $display = array_values(array_filter(
            $history,
            fn ($row) => ! $year || str_starts_with($row['month'], "{$year}-"),
        ));
        $totals = array_column($display, 'total_visits');
        $highest = $display[array_keys($totals, max($totals))[0]];
        $lowest = $display[array_keys($totals, min($totals))[0]];
        $first = $totals[0];
        $last = $totals[array_key_last($totals)];
        $change = $first > 0 ? (($last - $first) / $first) * 100 : 0;

        $distribution = [];
        foreach (self::CATEGORIES as $key => $label) {
            $distribution[] = [
                'key' => $key,
                'name' => $label,
                'value' => array_sum(array_column($display, $key)),
            ];
        }

        $yearly = [];
        foreach ($history as $row) {
            $recordYear = (int) substr($row['month'], 0, 4);
            $yearly[$recordYear] = ($yearly[$recordYear] ?? 0) + $row['total_visits'];
        }

        $forecast = $totalForecast['forecast'];

        return [
            'meta' => [
                'is_demo' => $isDemo,
                'label' => $isDemo ? 'Sample Data · Demo Patient Visits' : 'Aggregated patient visit data',
                'period' => 'January 2021 – December 2025',
                'disclaimer' => 'Demonstration data for visualization and resource-planning analysis only. These are not actual clinic or patient records.',
                'generated_at' => now()->toIso8601String(),
            ],
            'filters' => ['year' => $year, 'horizon' => $horizon, 'years' => array_keys($yearly)],
            'summary' => [
                'total_visits' => array_sum($totals),
                'average_monthly_visits' => round(array_sum($totals) / count($totals), 1),
                'highest_month' => $highest['month'],
                'highest_month_visits' => $highest['total_visits'],
                'lowest_month' => $lowest['month'],
                'lowest_month_visits' => $lowest['total_visits'],
                'predicted_next_month' => round($forecast[0]['predicted_cases']),
                'percentage_change' => round($change, 1),
            ],
            'history' => $display,
            'forecast' => $forecast,
            'model' => [
                'metrics' => $totalForecast['metrics'],
                'seasonal_pattern' => $totalForecast['seasonal_pattern'],
            ],
            'distribution' => $distribution,
            'yearly_comparison' => array_map(
                fn ($yearValue, $total) => ['year' => $yearValue, 'total_visits' => $total],
                array_keys($yearly),
                array_values($yearly),
            ),
            'category_forecasts' => $categoryForecasts,
            'insights' => $this->insights($forecast, $categoryForecasts),
        ];
    }

    /** @return list<string> */
    private function insights(array $forecast, array $categoryForecasts): array
    {
        $peak = collect($forecast)->sortByDesc('predicted_cases')->first();
        $peakMonth = now()->createFromFormat('!Y-m', $peak['month'])->format('F Y');
        $walkIn = $categoryForecasts['walk_in']['forecast'];
        $walkInChange = end($walkIn)['predicted_cases'] - $walkIn[0]['predicted_cases'];

        return [
            'Patient visits are expected to increase during historically busy rainy-season and year-end periods.',
            "The highest patient volume in the selected forecast horizon is projected for {$peakMonth}, based on recurring seasonal demand.",
            $walkInChange >= 0
                ? 'Walk-in consultations show an upward projection across the selected horizon.'
                : 'Walk-in consultations show a short-term decline before the next seasonal cycle.',
            'Year-end capacity planning should account for historically higher APE and company-referral demand.',
        ];
    }
}
