<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

function scenarioArchiveMonth(string $start, int $hours): array
{
    $date = \Carbon\CarbonImmutable::parse($start.' 00:00', 'Asia/Manila');

    return [
        'timezone' => 'Asia/Manila',
        'hourly_units' => ['temperature_2m' => '°C', 'relative_humidity_2m' => '%', 'precipitation' => 'mm'],
        'hourly' => [
            'time' => array_map(fn ($i) => $date->addHours($i)->format('Y-m-d\TH:00'), range(0, $hours - 1)),
            'temperature_2m' => array_fill(0, $hours, 27),
            'relative_humidity_2m' => array_fill(0, $hours, 82),
            'precipitation' => array_fill(0, $hours, 0.5),
        ],
    ];
}

function scenarioMlResponse(string $forecastMonth, string $sourceMonth): array
{
    return [
        'forecast_month' => $forecastMonth,
        'data_type' => 'Synthetic Simulation',
        'validated_on_real_data' => false,
        'weather_assumption' => 'Open-Meteo 2025 historical analog for selected month\'s lagged weather',
        'weather_source' => 'Open-Meteo historical reanalysis/model estimates',
        'weather_source_month' => $sourceMonth,
        'scenario_only' => true,
        'predictions' => collect(['Dengue', 'Leptospirosis', 'Influenza_ILI', 'Typhoid', 'Cholera', 'Heat_Stroke', 'Food_Poisoning', 'Sore_Eyes'])
            ->map(fn ($disease) => ['disease' => $disease, 'predicted_cases' => 19, 'method' => 'Random Forest'])->all(),
    ];
}

it('sends a complete Open-Meteo previous-month analog to the ML scenario endpoint', function () {
    Storage::fake('local');
    config()->set('services.lmic_ml.url', 'http://ml.internal:8001');
    Http::fake([
        'archive-api.open-meteo.com/*' => Http::response(scenarioArchiveMonth('2025-09-01', 720)),
        'ml.internal:8001/forecast/weather-scenario' => Http::response(scenarioMlResponse('October 2026', '2025-09')),
    ]);
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->getJson('/admin/api/forecast/weather-scenario?year=2026&month=10')
        ->assertOk()
        ->assertJsonPath('weather_source_month', '2025-09')
        ->assertJsonPath('weather_values.monthly_avg_temp_c', 27)
        ->assertJsonPath('weather_values.monthly_avg_humidity_percent', 82)
        ->assertJsonPath('weather_values.monthly_total_rainfall_mm', 360)
        ->assertJsonPath('scenario_only', true)
        ->assertJsonCount(8, 'predictions');
    Storage::disk('local')->assertExists('weather/monthly/2025-09.json');
    Http::assertSent(fn ($request) => $request->method() === 'POST'
        && str_contains($request->url(), '/forecast/weather-scenario')
        && $request['source_month'] === '2025-09'
        && $request['avg_temp_c'] === 27.0);
});

it('uses the corresponding analog month for November and December', function () {
    Storage::fake('local');
    config()->set('services.lmic_ml.url', 'http://ml.internal:8001');
    Http::fake(fn ($request) => str_contains($request->url(), 'archive-api.open-meteo.com')
        ? Http::response(str_contains($request->url(), 'start_date=2025-10-01')
            ? scenarioArchiveMonth('2025-10-01', 744)
            : scenarioArchiveMonth('2025-11-01', 720))
        : Http::response(scenarioMlResponse(
            $request['month'] === 11 ? 'November 2026' : 'December 2026',
            $request['month'] === 11 ? '2025-10' : '2025-11'
        )));
    $this->actingAs(User::factory()->create(['role' => 'admin']));
    $this->getJson('/admin/api/forecast/weather-scenario?year=2026&month=11')
        ->assertOk()->assertJsonPath('weather_source_month', '2025-10');
    $this->getJson('/admin/api/forecast/weather-scenario?year=2026&month=12')
        ->assertOk()->assertJsonPath('weather_source_month', '2025-11');
});

it('rejects incomplete historical weather and unauthorized access', function () {
    Storage::fake('local');
    Storage::disk('local')->put('weather/monthly/2025-09.json', json_encode([
        'month' => '2025-09', 'timezone' => 'Asia/Manila',
        'source' => 'Open-Meteo historical reanalysis/model estimates',
        'completeness' => ['complete' => false],
    ]));
    Http::fake();
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->getJson('/admin/api/forecast/weather-scenario?year=2026&month=10')->assertStatus(503);
    Http::assertNothingSent();
    $this->getJson('/admin/api/forecast/weather-scenario?year=2026&month=9')
        ->assertUnprocessable()->assertJsonValidationErrors('month');
    $this->actingAs(User::factory()->create(['role' => 'patient']))
        ->getJson('/admin/api/forecast/weather-scenario?year=2026&month=10')->assertForbidden();
});
