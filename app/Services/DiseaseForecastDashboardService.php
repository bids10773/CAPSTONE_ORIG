<?php

namespace App\Services;

use App\Repositories\DiseaseCaseRepository;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;

class DiseaseForecastDashboardService
{
    private const DEMO_DISEASES = [
        'Hypertension' => [42, 39, 44, 47, 50, 48, 45, 43, 46, 49, 52, 54],
        'Diabetes' => [28, 30, 29, 31, 34, 33, 35, 34, 36, 38, 37, 40],
        'URTI' => [52, 48, 40, 32, 25, 20, 18, 22, 31, 44, 57, 63],
        'Dengue' => [8, 7, 9, 14, 22, 35, 48, 55, 43, 28, 16, 10],
        'Tuberculosis' => [12, 13, 12, 14, 13, 15, 14, 15, 16, 15, 16, 17],
        'Others' => [18, 17, 20, 19, 21, 22, 20, 23, 22, 24, 25, 24],
    ];

    public function __construct(
        private readonly DiseaseCaseRepository $repository,
        private readonly ForecastService $forecaster,
    ) {}

    /** @return array<string, mixed> */
    public function dashboard(array $filters): array
    {
        $key = 'disease-forecast:v1:'.hash('xxh128', json_encode($filters));

        return Cache::remember($key, now()->addMinutes(15), function () use ($filters) {
            [$records, $isDemo] = $this->records();
            $disease = $filters['disease'] ?? null;
            $year = isset($filters['year']) ? (int) $filters['year'] : null;
            $horizon = (int) ($filters['horizon'] ?? 12);
            $seasonLength = (int) ($filters['season_length'] ?? 12);
            $parameters = [
                'horizon' => $horizon,
                'seasonLength' => $seasonLength,
                'alpha' => (float) ($filters['alpha'] ?? 0.3),
                'beta' => (float) ($filters['beta'] ?? 0.1),
                'gamma' => (float) ($filters['gamma'] ?? 0.2),
            ];

            $availableDiseases = $records->pluck('disease')->unique()->sort()->values()->all();
            if ($disease && ! in_array($disease, $availableDiseases, true)) {
                throw new InvalidArgumentException("No records were found for disease '{$disease}'.");
            }

            $forecastSource = $records->when($disease, fn (Collection $rows) => $rows->where('disease', $disease));
            $displayHistory = $forecastSource->when(
                $year,
                fn (Collection $rows) => $rows->filter(fn ($row) => str_starts_with($row['month'], "{$year}-"))
            );

            $results = [];
            foreach ($forecastSource->groupBy('disease') as $name => $rows) {
                $observations = $rows->map(fn ($row) => ['month' => $row['month'], 'cases' => $row['cases']])->values()->all();
                $result = $this->forecaster->forecast($observations, ...$parameters);
                if ($year) {
                    $result['history'] = array_values(array_filter(
                        $result['history'],
                        fn ($point) => str_starts_with($point['month'], "{$year}-")
                    ));
                }
                $result['disease'] = $name;
                $result['explanation'] = $this->explanation($name, $result['metrics'], $horizon);
                $results[] = $result;
            }

            usort($results, fn ($a, $b) => $b['metrics']['growth_percentage'] <=> $a['metrics']['growth_percentage']);
            $totals = $records->groupBy('disease')->map->sum('cases');
            $highestPredicted = collect($results)->sortByDesc(
                fn ($item) => array_sum(array_column($item['forecast'], 'predicted_cases'))
            )->first();

            $lowestGrowth = $results === [] ? null : $results[array_key_last($results)];

            return [
                'meta' => [
                    'is_demo' => $isDemo,
                    'label' => $isDemo ? 'Sample Data · Demo Forecast' : 'Clinical trend data',
                    'disclaimer' => 'For decision support and trend analysis only. This forecast does not diagnose patients or recommend treatment.',
                    'generated_at' => now()->toIso8601String(),
                ],
                'filters' => [
                    'diseases' => $availableDiseases,
                    'selected_disease' => $disease,
                    'selected_year' => $year,
                    'horizon' => $horizon,
                ],
                'summary' => [
                    'total_diseases' => count($availableDiseases),
                    'most_common_disease' => $totals->sortDesc()->keys()->first(),
                    'highest_predicted_disease' => $highestPredicted['disease'] ?? null,
                    'highest_growth' => $results[0]['disease'] ?? null,
                    'highest_growth_percentage' => $results[0]['metrics']['growth_percentage'] ?? 0,
                    'lowest_growth' => $lowestGrowth['disease'] ?? null,
                    'lowest_growth_percentage' => $lowestGrowth['metrics']['growth_percentage'] ?? 0,
                ],
                'history' => $displayHistory->values()->all(),
                'diseases' => $results,
            ];
        });
    }

    /** @return array{0:Collection, 1:bool} */
    private function records(): array
    {
        $records = $this->repository->monthly();
        if ($records->isNotEmpty()) {
            return [$records, false];
        }

        $start = CarbonImmutable::now()->startOfMonth()->subMonths(35);
        $demo = collect();
        foreach (self::DEMO_DISEASES as $disease => $season) {
            for ($i = 0; $i < 36; $i++) {
                $annualGrowth = match ($disease) {
                    'Hypertension' => 2.2,
                    'Diabetes' => 1.7,
                    'Dengue' => 0.8,
                    'Tuberculosis' => -0.3,
                    default => 0.3,
                };
                $demo->push([
                    'disease' => $disease,
                    'month' => $start->addMonths($i)->format('Y-m'),
                    'cases' => max(0, (int) round($season[$i % 12] + (($i / 12) * $annualGrowth))),
                ]);
            }
        }

        return [$demo, true];
    }

    private function explanation(string $disease, array $metrics, int $horizon): string
    {
        $verb = match ($metrics['direction']) {
            'increasing' => 'increase',
            'decreasing' => 'decrease',
            default => 'remain broadly stable',
        };
        $change = abs($metrics['growth_percentage']);
        $amount = $metrics['direction'] === 'stable' ? '' : " by approximately {$change}%";

        return "{$disease} is expected to {$verb}{$amount} over the next {$horizon} months based on historical level, trend, and seasonal patterns.";
    }
}
