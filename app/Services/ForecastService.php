<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use InvalidArgumentException;

class ForecastService
{
    /**
     * Additive Holt-Winters forecast.
     *
     * @param  array<int, array{month:string, cases:int|float}>  $observations
     * @return array<string, mixed>
     */
    public function forecast(
        array $observations,
        int $horizon = 12,
        int $seasonLength = 12,
        float $alpha = 0.3,
        float $beta = 0.1,
        float $gamma = 0.2,
    ): array {
        $this->validateParameters($horizon, $seasonLength, $alpha, $beta, $gamma);
        $series = $this->normalize($observations);

        if (count($series) < $seasonLength * 2) {
            throw new InvalidArgumentException(
                "At least {$seasonLength} × 2 months of data are required for seasonal forecasting."
            );
        }

        $values = array_column($series, 'cases');
        $level = array_sum(array_slice($values, 0, $seasonLength)) / $seasonLength;
        $secondAverage = array_sum(array_slice($values, $seasonLength, $seasonLength)) / $seasonLength;
        $trend = ($secondAverage - $level) / $seasonLength;
        $seasonals = [];

        for ($i = 0; $i < $seasonLength; $i++) {
            $seasonals[$i] = (($values[$i] - $level) + ($values[$i + $seasonLength] - $secondAverage)) / 2;
        }

        $fitted = [];
        $residuals = [];
        foreach ($values as $i => $value) {
            if ($i === 0) {
                $fitted[] = $value;

                continue;
            }

            $season = $seasonals[$i % $seasonLength];
            $prediction = $level + $trend + $season;
            $previousLevel = $level;
            $level = $alpha * ($value - $season) + (1 - $alpha) * ($level + $trend);
            $trend = $beta * ($level - $previousLevel) + (1 - $beta) * $trend;
            $seasonals[$i % $seasonLength] = $gamma * ($value - $level) + (1 - $gamma) * $season;
            $fitted[] = round(max(0, $prediction), 2);
            $residuals[] = $value - $prediction;
        }

        $rmse = $residuals === []
            ? 0.0
            : sqrt(array_sum(array_map(fn ($value) => $value ** 2, $residuals)) / count($residuals));
        $lastMonth = CarbonImmutable::createFromFormat('!Y-m', end($series)['month']);
        $forecast = [];

        for ($step = 1; $step <= $horizon; $step++) {
            $value = max(0, $level + ($step * $trend) + $seasonals[(count($values) + $step - 1) % $seasonLength]);
            $uncertainty = 1.96 * $rmse * sqrt($step);
            $forecast[] = [
                'month' => $lastMonth->addMonths($step)->format('Y-m'),
                'predicted_cases' => round($value, 2),
                'lower_bound' => round(max(0, $value - $uncertainty), 2),
                'upper_bound' => round($value + $uncertainty, 2),
            ];
        }

        $recent = array_sum(array_slice($values, -min($horizon, count($values)))) / min($horizon, count($values));
        $future = array_sum(array_column($forecast, 'predicted_cases')) / count($forecast);
        $growth = $recent > 0 ? (($future - $recent) / $recent) * 100 : 0.0;

        return [
            'history' => array_map(fn ($point, $fit) => [
                ...$point,
                'fitted_cases' => $fit,
            ], $series, $fitted),
            'forecast' => $forecast,
            'seasonal_pattern' => array_map(fn ($index, $value) => [
                'month_index' => $index + 1,
                'effect' => round($value, 2),
            ], array_keys($seasonals), array_values($seasonals)),
            'metrics' => [
                'level' => round($level, 2),
                'trend' => round($trend, 2),
                'rmse' => round($rmse, 2),
                'growth_percentage' => round($growth, 1),
                'direction' => $growth > 1 ? 'increasing' : ($growth < -1 ? 'decreasing' : 'stable'),
            ],
            'parameters' => compact('alpha', 'beta', 'gamma', 'seasonLength', 'horizon'),
        ];
    }

    /** @param array<int, array{month:string, cases:int|float}> $observations */
    private function normalize(array $observations): array
    {
        $months = [];
        foreach ($observations as $row) {
            if (! isset($row['month'], $row['cases']) || ! is_numeric($row['cases']) || $row['cases'] < 0) {
                throw new InvalidArgumentException('Every observation requires a valid month and a non-negative case count.');
            }

            try {
                $month = CarbonImmutable::createFromFormat('!Y-m', $row['month'])->format('Y-m');
            } catch (\Throwable) {
                throw new InvalidArgumentException("Invalid month '{$row['month']}'. Expected YYYY-MM.");
            }

            if (isset($months[$month])) {
                throw new InvalidArgumentException("Duplicate observation for {$month}.");
            }
            $months[$month] = (float) $row['cases'];
        }

        ksort($months);
        if ($months === []) {
            throw new InvalidArgumentException('The forecasting dataset is empty.');
        }

        $start = CarbonImmutable::createFromFormat('!Y-m', array_key_first($months));
        $end = CarbonImmutable::createFromFormat('!Y-m', array_key_last($months));
        $normalized = [];
        for ($cursor = $start; $cursor->lessThanOrEqualTo($end); $cursor = $cursor->addMonth()) {
            $key = $cursor->format('Y-m');
            $normalized[] = ['month' => $key, 'cases' => $months[$key] ?? 0.0];
        }

        return $normalized;
    }

    private function validateParameters(int $horizon, int $seasonLength, float ...$smoothing): void
    {
        if ($horizon < 1 || $horizon > 36) {
            throw new InvalidArgumentException('Forecast horizon must be between 1 and 36 months.');
        }
        if ($seasonLength < 2 || $seasonLength > 24) {
            throw new InvalidArgumentException('Seasonal period must be between 2 and 24 months.');
        }
        foreach ($smoothing as $value) {
            if ($value <= 0 || $value > 1) {
                throw new InvalidArgumentException('Alpha, beta, and gamma must be greater than 0 and at most 1.');
            }
        }
    }
}
