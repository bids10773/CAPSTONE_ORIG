<?php

use App\Models\User;
use App\Services\OpenMeteoWeatherService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

function currentWeatherPayload(): array
{
    return [
        'timezone' => 'Asia/Manila',
        'current_units' => ['temperature_2m' => '°C', 'relative_humidity_2m' => '%', 'precipitation' => 'mm'],
        'current' => [
            'time' => '2026-09-17T10:15', 'interval' => 900,
            'temperature_2m' => 30.5, 'relative_humidity_2m' => 78, 'precipitation' => 0.4,
        ],
    ];
}

function hourlyWeatherPayload(int $hours): array
{
    $start = \Carbon\CarbonImmutable::parse('2024-02-01 00:00', 'Asia/Manila');

    return [
        'timezone' => 'Asia/Manila',
        'hourly_units' => ['temperature_2m' => '°C', 'relative_humidity_2m' => '%', 'precipitation' => 'mm'],
        'hourly' => [
            'time' => array_map(fn ($i) => $start->addHours($i)->format('Y-m-d\TH:00'), range(0, $hours - 1)),
            'temperature_2m' => array_fill(0, $hours, 28),
            'relative_humidity_2m' => array_fill(0, $hours, 80),
            'precipitation' => array_fill(0, $hours, 1),
        ],
    ];
}

it('retrieves and caches current weather with the observation time and precipitation period', function () {
    Cache::forget('weather:calamba:current');
    Cache::forget('weather:calamba:last-success');
    Http::fake(['api.open-meteo.com/*' => Http::response(currentWeatherPayload())]);
    $this->actingAs(User::factory()->create(['role' => 'admin']));

    $this->getJson('/admin/api/forecast/weather')->assertOk()
        ->assertJsonPath('location', 'Calamba City, Laguna')
        ->assertJsonPath('temperature_c', 30.5)
        ->assertJsonPath('relative_humidity_percent', 78)
        ->assertJsonPath('precipitation_mm', 0.4)
        ->assertJsonPath('precipitation_period_minutes', 15)
        ->assertJsonPath('stale', false)
        ->assertJsonPath('observation_time', '2026-09-17T10:15:00+08:00');
    $this->getJson('/admin/api/forecast/weather')->assertOk();
    Http::assertSentCount(1);
    Http::assertSent(fn ($request) => str_contains($request->url(), 'latitude=14.2106')
        && str_contains($request->url(), 'timezone=Asia%2FManila'));
});

it('marks cached weather stale on provider failure and reports unavailable without a cache', function () {
    Cache::forget('weather:calamba:current');
    Cache::forget('weather:calamba:last-success');
    Http::fakeSequence()
        ->push(currentWeatherPayload())
        ->push(['error' => true], 500)
        ->push(['error' => true], 500);
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->getJson('/admin/api/forecast/weather')->assertOk();
    Cache::forget('weather:calamba:current');
    $this->getJson('/admin/api/forecast/weather')->assertOk()
        ->assertJsonPath('stale', true)
        ->assertJsonPath('temperature_c', 30.5);

    Cache::forget('weather:calamba:last-success');
    $this->getJson('/admin/api/forecast/weather')->assertStatus(503)->assertJsonStructure(['message']);
    $this->actingAs(User::factory()->create(['role' => 'patient']))
        ->getJson('/admin/api/forecast/weather')->assertForbidden();
});

it('aggregates a complete Manila calendar month without changing ML inputs', function () {
    Storage::fake('local');
    Http::fake(['archive-api.open-meteo.com/*' => Http::response(hourlyWeatherPayload(696))]);
    $result = app(OpenMeteoWeatherService::class)->syncMonth(2024, 2);

    expect($result['month'])->toBe('2024-02')
        ->and($result['monthly_avg_temp_c'])->toBe(28.0)
        ->and($result['monthly_avg_humidity_percent'])->toBe(80.0)
        ->and($result['monthly_total_rainfall_mm'])->toBe(696.0)
        ->and($result['completeness']['complete'])->toBeTrue()
        ->and($result['model_compatible'])->toBeFalse();
    Storage::disk('local')->assertExists('weather/monthly/2024-02.json');
    Http::assertSent(fn ($request) => str_contains($request->url(), 'start_date=2024-02-01')
        && str_contains($request->url(), 'end_date=2024-02-29'));
});

it('marks missing hourly observations incomplete and rejects the current month', function () {
    $service = app(OpenMeteoWeatherService::class);
    $data = hourlyWeatherPayload(696);
    $data['hourly']['relative_humidity_2m'][3] = null;
    $result = $service->aggregateMonth($data, 2024, 2);
    expect($result['completeness']['complete'])->toBeFalse()
        ->and($result['completeness']['available_hours']['relative_humidity_2m'])->toBe(695);
    $current = \Carbon\CarbonImmutable::now('Asia/Manila');
    expect(fn () => $service->syncMonth($current->year, $current->month))->toThrow(RuntimeException::class);
});

it('rejects malformed current weather without showing invented values', function () {
    Cache::forget('weather:calamba:current');
    Cache::forget('weather:calamba:last-success');
    $payload = currentWeatherPayload();
    $payload['current']['precipitation'] = null;
    Http::fake(['api.open-meteo.com/*' => Http::response($payload)]);

    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->getJson('/admin/api/forecast/weather')
        ->assertStatus(503)->assertJsonMissingPath('temperature_c');
});
