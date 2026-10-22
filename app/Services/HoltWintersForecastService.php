<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use InvalidArgumentException;

class HoltWintersForecastService
{
    /**
     * Additive Holt-Winters triple exponential smoothing.
     *
     * @param  list<array{period:string, value:int|float}>  $observations
     * @return array<string, mixed>
     */
    public function forecast(
        array $observations,
        int $horizon,
        string $frequency,
        float $alpha = 0.3,
        float $beta = 0.1,
        float $gamma = 0.2,
    ): array {
        $seasonLength = $frequency === 'daily' ? 7 : 12;
        $maximumHorizon = $frequency === 'daily' ? 90 : 24;

        if (! in_array($frequency, ['daily', 'monthly'], true)) {
            throw new InvalidArgumentException('Frequency must be daily or monthly.');
        }
        if ($horizon < 1 || $horizon > $maximumHorizon) {
            throw new InvalidArgumentException("Forecast horizon must be between 1 and {$maximumHorizon}.");
        }

        $series = $this->normalize($observations, $frequency);
        $required = $seasonLength * 2;
        if (count($series) < $required) {
            throw new InvalidArgumentException(
                "At least {$required} {$frequency} observations are required for seasonal forecasting."
            );
        }

        $values = array_column($series, 'value');
        $firstAverage = array_sum(array_slice($values, 0, $seasonLength)) / $seasonLength;
        $secondAverage = array_sum(array_slice($values, $seasonLength, $seasonLength)) / $seasonLength;
        $level = $firstAverage;
        $trend = ($secondAverage - $firstAverage) / $seasonLength;
        $seasonals = [];

        for ($index = 0; $index < $seasonLength; $index++) {
            $seasonals[$index] = (
                ($values[$index] - $firstAverage)
                + ($values[$index + $seasonLength] - $secondAverage)
            ) / 2;
        }

        $fitted = [];
        $residuals = [];
        foreach ($values as $index => $value) {
            if ($index === 0) {
                $fitted[] = round($value, 2);

                continue;
            }

            $seasonIndex = $index % $seasonLength;
            $season = $seasonals[$seasonIndex];
            $prediction = max(0, $level + $trend + $season);
            $previousLevel = $level;
            $level = $alpha * ($value - $season) + (1 - $alpha) * ($level + $trend);
            $trend = $beta * ($level - $previousLevel) + (1 - $beta) * $trend;
            $seasonals[$seasonIndex] = $gamma * ($value - $level) + (1 - $gamma) * $season;
            $fitted[] = round($prediction, 2);
            $residuals[] = $value - $prediction;
        }

        $rmse = sqrt(array_sum(array_map(fn (float|int $value) => $value ** 2, $residuals)) / count($residuals));
        $lastPeriod = $this->parsePeriod(end($series)['period'], $frequency);
        $forecast = [];

        for ($step = 1; $step <= $horizon; $step++) {
            $estimate = max(
                0,
                $level + ($step * $trend) + $seasonals[(count($values) + $step - 1) % $seasonLength],
            );
            $uncertainty = 1.96 * $rmse * sqrt($step);
            $period = $frequency === 'daily'
                ? $lastPeriod->addDays($step)->format('Y-m-d')
                : $lastPeriod->addMonths($step)->format('Y-m');

            $forecast[] = [
                'period' => $period,
                'estimated_patients' => round($estimate, 2),
                'lower_bound' => round(max(0, $estimate - $uncertainty), 2),
                'upper_bound' => round($estimate + $uncertainty, 2),
            ];
        }

        $comparisonLength = min($horizon, count($values));
        $recentAverage = array_sum(array_slice($values, -$comparisonLength)) / $comparisonLength;
        $forecastAverage = array_sum(array_column($forecast, 'estimated_patients')) / count($forecast);
        $growth = $recentAverage > 0 ? (($forecastAverage - $recentAverage) / $recentAverage) * 100 : 0.0;

        return [
            'history' => array_map(
                fn (array $point, float $fit) => [...$point, 'fitted_value' => $fit],
                $series,
                $fitted,
            ),
            'forecast' => $forecast,
            'metrics' => [
                'rmse' => round($rmse, 2),
                'trend_per_period' => round($trend, 2),
                'projected_change_percentage' => round($growth, 1),
                'direction' => $growth > 1 ? 'increasing' : ($growth < -1 ? 'decreasing' : 'stable'),
            ],
            'parameters' => [
                'method' => 'Additive Holt-Winters triple exponential smoothing',
                'alpha' => $alpha,
                'beta' => $beta,
                'gamma' => $gamma,
                'season_length' => $seasonLength,
                'horizon' => $horizon,
            ],
        ];
    }

    /**
     * @param  list<array{period:string, value:int|float}>  $observations
     * @return list<array{period:string, value:float}>
     */
    private function normalize(array $observations, string $frequency): array
    {
        $periods = [];
        foreach ($observations as $observation) {
            if (! isset($observation['period'], $observation['value'])
                || ! is_numeric($observation['value'])
                || $observation['value'] < 0) {
                throw new InvalidArgumentException('Each observation requires a period and a non-negative patient count.');
            }

            $period = $this->parsePeriod($observation['period'], $frequency)->format(
                $frequency === 'daily' ? 'Y-m-d' : 'Y-m',
            );
            if (isset($periods[$period])) {
                throw new InvalidArgumentException("Duplicate observation for {$period}.");
            }
            $periods[$period] = (float) $observation['value'];
        }

        if ($periods === []) {
            throw new InvalidArgumentException('The forecasting dataset is empty.');
        }

        ksort($periods);
        $cursor = $this->parsePeriod(array_key_first($periods), $frequency);
        $end = $this->parsePeriod(array_key_last($periods), $frequency);
        $normalized = [];

        while ($cursor->lessThanOrEqualTo($end)) {
            $period = $cursor->format($frequency === 'daily' ? 'Y-m-d' : 'Y-m');
            $normalized[] = ['period' => $period, 'value' => $periods[$period] ?? 0.0];
            $cursor = $frequency === 'daily' ? $cursor->addDay() : $cursor->addMonth();
        }

        return $normalized;
    }

    private function parsePeriod(string $period, string $frequency): CarbonImmutable
    {
        $format = $frequency === 'daily' ? '!Y-m-d' : '!Y-m';
        $expected = $frequency === 'daily' ? 'Y-m-d' : 'Y-m';

        try {
            $date = CarbonImmutable::createFromFormat($format, $period);
        } catch (\Throwable) {
            throw new InvalidArgumentException("Invalid period '{$period}'. Expected {$expected}.");
        }

        if (! $date || $date->format($expected) !== $period) {
            throw new InvalidArgumentException("Invalid period '{$period}'. Expected {$expected}.");
        }

        return $date;
    }
}
