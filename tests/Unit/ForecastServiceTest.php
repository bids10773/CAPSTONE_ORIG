<?php

use App\Services\ForecastService;
use Carbon\CarbonImmutable;

it('models level trend and additive seasonality', function () {
    $start = CarbonImmutable::parse('2022-01-01');
    $season = [8, 4, 1, -2, -4, -5, -3, 0, 2, 4, 6, 9];
    $observations = [];

    for ($i = 0; $i < 36; $i++) {
        $observations[] = [
            'month' => $start->addMonths($i)->format('Y-m'),
            'cases' => 40 + ($i * 0.5) + $season[$i % 12],
        ];
    }

    $result = app(ForecastService::class)->forecast($observations, 12);

    expect($result['forecast'])->toHaveCount(12)
        ->and($result['seasonal_pattern'])->toHaveCount(12)
        ->and($result['metrics']['direction'])->toBe('increasing')
        ->and($result['metrics']['trend'])->toBeGreaterThan(0)
        ->and($result['forecast'][0]['month'])->toBe('2025-01')
        ->and($result['forecast'][0]['upper_bound'])->toBeGreaterThanOrEqual($result['forecast'][0]['predicted_cases'])
        ->and($result['forecast'][0]['lower_bound'])->toBeLessThanOrEqual($result['forecast'][0]['predicted_cases']);
});

it('fills missing months and rejects duplicates negative counts and short datasets', function () {
    $service = app(ForecastService::class);

    expect(fn () => $service->forecast([
        ['month' => '2024-01', 'cases' => 4],
        ['month' => '2024-01', 'cases' => 5],
    ]))->toThrow(InvalidArgumentException::class, 'Duplicate');

    expect(fn () => $service->forecast([
        ['month' => '2024-01', 'cases' => -1],
    ]))->toThrow(InvalidArgumentException::class, 'non-negative');

    expect(fn () => $service->forecast([
        ['month' => '2024-01', 'cases' => 1],
        ['month' => '2025-12', 'cases' => 1],
    ], seasonLength: 12))->not->toThrow(InvalidArgumentException::class);
});

it('validates smoothing parameters and seasonal period', function () {
    $service = app(ForecastService::class);

    expect(fn () => $service->forecast([], alpha: 0))
        ->toThrow(InvalidArgumentException::class, 'Alpha');
    expect(fn () => $service->forecast([], seasonLength: 1))
        ->toThrow(InvalidArgumentException::class, 'Seasonal period');
});
