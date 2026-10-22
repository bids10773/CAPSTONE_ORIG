<?php

use App\Services\HoltWintersForecastService;

it('forecasts a daily seasonal series without negative patient estimates', function () {
    $start = today()->subDays(20);
    $observations = [];

    for ($day = 0; $day < 21; $day++) {
        $observations[] = [
            'period' => $start->copy()->addDays($day)->format('Y-m-d'),
            'value' => 8 + ($day % 7),
        ];
    }

    $result = app(HoltWintersForecastService::class)->forecast($observations, 7, 'daily');

    expect($result['forecast'])->toHaveCount(7)
        ->and(collect($result['forecast'])->min('estimated_patients'))->toBeGreaterThanOrEqual(0)
        ->and($result['parameters']['season_length'])->toBe(7);
});

it('rejects seasonal forecasting when historical observations are insufficient', function () {
    app(HoltWintersForecastService::class)->forecast([
        ['period' => '2026-10-01', 'value' => 4],
        ['period' => '2026-10-02', 'value' => 6],
    ], 7, 'daily');
})->throws(InvalidArgumentException::class, 'At least 14 daily observations');
