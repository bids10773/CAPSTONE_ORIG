<?php

namespace App\Services;

use App\Models\Appointment;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class PatientVisitForecastService
{
    private const ATTENDED_STATUSES = [
        'arrived', 'for_physical_examination', 'for_diagnostics', 'for_xray',
        'awaiting_xray_result', 'verifying_xray', 'verifying_drug_test',
        'verifying_drug_and_xray', 'for_final_evaluation', 'completed',
    ];

    public function __construct(private readonly HoltWintersForecastService $forecaster) {}

    /** @return array<string, mixed> */
    public function dashboard(
        ?string $startDate = null,
        ?string $endDate = null,
        int $dailyHorizon = 14,
        int $monthlyHorizon = 6,
    ): array {
        $today = CarbonImmutable::today();
        $firstVisit = $this->actualVisits()->min('appointment_date');
        $start = $startDate
            ? CarbonImmutable::parse($startDate)->startOfDay()
            : ($firstVisit ? CarbonImmutable::parse($firstVisit)->startOfDay() : $today->subDays(29));
        $end = $endDate ? CarbonImmutable::parse($endDate)->endOfDay() : $today->endOfDay();

        $visits = $this->actualVisits()
            ->whereDate('appointment_date', '>=', $start->format('Y-m-d'))
            ->whereDate('appointment_date', '<=', $end->format('Y-m-d'))
            ->get(['id', 'user_id', 'appointment_date']);

        $dailyHistory = $this->dailyHistory($visits, $start, $end);
        $monthlyHistory = $this->monthlyHistory($visits, $start, $end);
        $dailyTrainingHistory = array_values(array_filter(
            $dailyHistory,
            fn (array $point) => CarbonImmutable::parse($point['period'])->lessThan($today),
        ));
        $monthlyTrainingHistory = array_values(array_filter(
            $monthlyHistory,
            function (array $point) use ($start, $end, $today): bool {
                $month = CarbonImmutable::createFromFormat('!Y-m', $point['period']);

                return $month->greaterThanOrEqualTo($start->startOfDay())
                    && $month->endOfMonth()->lessThanOrEqualTo($end)
                    && $month->endOfMonth()->lessThan($today);
            },
        ));
        $dailyForecast = $this->forecast(
            $dailyTrainingHistory,
            $dailyHorizon,
            'daily',
            14,
            array_sum(array_column($dailyTrainingHistory, 'count')),
        );
        $monthlyForecast = $this->forecast(
            $monthlyTrainingHistory,
            $monthlyHorizon,
            'monthly',
            24,
            array_sum(array_column($monthlyTrainingHistory, 'count')),
        );

        return [
            'meta' => [
                'source' => 'Actual attended appointment records',
                'definition' => 'One attended or clinically processed appointment equals one patient visit. Company event parent bookings, cancellations, rejections, absences, and unarrived bookings are excluded.',
                'method' => 'Additive Holt-Winters triple exponential smoothing',
                'disclaimer' => 'Forecasted patient volumes are estimates for operational planning, not guaranteed patient counts.',
                'generated_at' => now()->toIso8601String(),
            ],
            'filters' => [
                'start_date' => $start->format('Y-m-d'),
                'end_date' => $end->format('Y-m-d'),
                'daily_horizon' => $dailyHorizon,
                'monthly_horizon' => $monthlyHorizon,
            ],
            'summary' => [
                'total_patients_today' => $this->countForRange($today, $today),
                'total_patients_this_month' => $this->countForRange($today->startOfMonth(), $today->endOfMonth()),
                'selected_period_visits' => $visits->count(),
                'selected_period_unique_patients' => $visits->pluck('user_id')->filter()->unique()->count(),
            ],
            'daily' => [
                'history' => $dailyHistory,
                'trend' => $this->trend($dailyHistory, 7),
                'forecast' => $dailyForecast,
            ],
            'monthly' => [
                'history' => $monthlyHistory,
                'trend' => $this->trend($monthlyHistory, 3),
                'forecast' => $monthlyForecast,
            ],
            'planning' => $this->planning($dailyForecast, $monthlyForecast),
        ];
    }

    private function actualVisits(): Builder
    {
        return Appointment::query()
            ->whereNotNull('appointment_date')
            ->where(function (Builder $query): void {
                $query->where('type', '!=', 'company_bulk')->orWhereNotNull('bulk_appointment_id');
            })
            ->whereNotIn('status', ['cancelled', 'rejected', 'absent'])
            ->where(function (Builder $query): void {
                $query->whereNotNull('arrived_at')
                    ->orWhere('attendance_status', 'arrived')
                    ->orWhereIn('status', self::ATTENDED_STATUSES);
            });
    }

    private function countForRange(CarbonImmutable $start, CarbonImmutable $end): int
    {
        return $this->actualVisits()
            ->whereDate('appointment_date', '>=', $start->format('Y-m-d'))
            ->whereDate('appointment_date', '<=', $end->format('Y-m-d'))
            ->count();
    }

    /** @return list<array{period:string, count:int}> */
    private function dailyHistory(Collection $visits, CarbonImmutable $start, CarbonImmutable $end): array
    {
        $counts = $visits->countBy(fn (Appointment $visit) => $visit->appointment_date->format('Y-m-d'));
        $history = [];

        for ($cursor = $start; $cursor->lessThanOrEqualTo($end); $cursor = $cursor->addDay()) {
            $period = $cursor->format('Y-m-d');
            $history[] = ['period' => $period, 'count' => (int) ($counts[$period] ?? 0)];
        }

        return $history;
    }

    /** @return list<array{period:string, count:int}> */
    private function monthlyHistory(Collection $visits, CarbonImmutable $start, CarbonImmutable $end): array
    {
        $counts = $visits->countBy(fn (Appointment $visit) => $visit->appointment_date->format('Y-m'));
        $history = [];

        for ($cursor = $start->startOfMonth(); $cursor->lessThanOrEqualTo($end->startOfMonth()); $cursor = $cursor->addMonth()) {
            $period = $cursor->format('Y-m');
            $history[] = ['period' => $period, 'count' => (int) ($counts[$period] ?? 0)];
        }

        return $history;
    }

    /** @return array<string, mixed> */
    private function forecast(array $history, int $horizon, string $frequency, int $required, int $visitCount): array
    {
        if ($visitCount === 0) {
            return $this->unavailableForecast($required, count($history), 'No attended patient visits exist in the selected date range.');
        }
        if (count($history) < $required) {
            return $this->unavailableForecast(
                $required,
                count($history),
                "At least {$required} complete {$frequency} observations are required for a seasonal forecast.",
            );
        }

        try {
            $result = $this->forecaster->forecast(array_map(fn (array $row) => [
                'period' => $row['period'],
                'value' => $row['count'],
            ], $history), $horizon, $frequency);
        } catch (InvalidArgumentException $exception) {
            return $this->unavailableForecast($required, count($history), $exception->getMessage());
        }

        return [
            'available' => true,
            'required_observations' => $required,
            'available_observations' => count($history),
            'data' => $result['forecast'],
            'metrics' => $result['metrics'],
            'parameters' => $result['parameters'],
        ];
    }

    /** @return array<string, mixed> */
    private function unavailableForecast(int $required, int $available, string $reason): array
    {
        return [
            'available' => false,
            'reason' => $reason,
            'required_observations' => $required,
            'available_observations' => $available,
            'data' => [],
            'metrics' => null,
            'parameters' => null,
        ];
    }

    /** @return array{direction:string, change_percentage:float, current_average:float, previous_average:float} */
    private function trend(array $history, int $window): array
    {
        $values = array_column($history, 'count');
        if (count($values) < $window * 2) {
            return [
                'direction' => 'stable',
                'change_percentage' => 0.0,
                'current_average' => round(array_sum($values) / max(1, count($values)), 1),
                'previous_average' => 0.0,
            ];
        }

        $current = array_sum(array_slice($values, -$window)) / $window;
        $previous = array_sum(array_slice($values, -($window * 2), $window)) / $window;
        $change = $previous > 0 ? (($current - $previous) / $previous) * 100 : ($current > 0 ? 100 : 0);

        return [
            'direction' => $change > 1 ? 'increasing' : ($change < -1 ? 'decreasing' : 'stable'),
            'change_percentage' => round($change, 1),
            'current_average' => round($current, 1),
            'previous_average' => round($previous, 1),
        ];
    }

    /** @return list<array{title:string, value:string, detail:string}> */
    private function planning(array $daily, array $monthly): array
    {
        return [
            [
                'title' => 'Staff allocation',
                'value' => $daily['available'] ? round(collect($daily['data'])->avg('estimated_patients')).' patients/day' : 'Awaiting history',
                'detail' => $daily['available']
                    ? 'Estimated average daily demand across the selected forecast horizon.'
                    : $daily['reason'],
            ],
            [
                'title' => 'Appointment scheduling',
                'value' => $daily['available'] ? round(collect($daily['data'])->max('estimated_patients')).' peak visits' : 'No estimate yet',
                'detail' => $daily['available']
                    ? 'Estimated busiest upcoming day; consider protecting capacity around this level.'
                    : 'More attended daily records are needed before scheduling guidance is shown.',
            ],
            [
                'title' => 'Supplies and resources',
                'value' => $monthly['available'] ? round(collect($monthly['data'])->avg('estimated_patients')).' patients/month' : 'Awaiting history',
                'detail' => $monthly['available']
                    ? 'Estimated average monthly demand for supply and resource planning.'
                    : $monthly['reason'],
            ],
        ];
    }
}
