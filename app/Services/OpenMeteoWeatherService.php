<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class OpenMeteoWeatherService
{
    private const TIMEZONE = 'Asia/Manila';

    /** @return array<string, mixed> */
    public function current(): array
    {
        if ($fresh = Cache::get('weather:calamba:current')) {
            return $fresh;
        }

        try {
            $response = Http::acceptJson()->timeout(8)->get(config('services.open_meteo.forecast_url'), [
                'latitude' => config('services.open_meteo.latitude'),
                'longitude' => config('services.open_meteo.longitude'),
                'timezone' => self::TIMEZONE,
                'current' => 'temperature_2m,relative_humidity_2m,precipitation',
                'temperature_unit' => 'celsius',
                'precipitation_unit' => 'mm',
            ]);
            if (! $response->successful()) {
                throw new RuntimeException('Weather provider request failed.');
            }
            $body = $response->json();
            $current = $body['current'] ?? null;
            $units = $body['current_units'] ?? null;
            if (! is_array($current) || ! is_array($units)
                || ($body['timezone'] ?? null) !== self::TIMEZONE
                || ($units['temperature_2m'] ?? null) !== '°C'
                || ($units['relative_humidity_2m'] ?? null) !== '%'
                || ($units['precipitation'] ?? null) !== 'mm'
                || ! is_string($current['time'] ?? null)
                || ! preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $current['time'])
                || ! is_numeric($current['temperature_2m'] ?? null)
                || ! is_numeric($current['relative_humidity_2m'] ?? null)
                || ! is_numeric($current['precipitation'] ?? null)
                || ! is_numeric($current['interval'] ?? null)
                || $current['interval'] <= 0
                || $current['interval'] % 60 !== 0
                || $current['relative_humidity_2m'] < 0 || $current['relative_humidity_2m'] > 100
                || $current['precipitation'] < 0) {
                throw new RuntimeException('Weather provider returned invalid data.');
            }
            $weather = [
                'location' => 'Calamba City, Laguna',
                'source' => 'Open-Meteo forecast model',
                'observation_time' => CarbonImmutable::parse($current['time'], self::TIMEZONE)->toIso8601String(),
                'temperature_c' => (float) $current['temperature_2m'],
                'relative_humidity_percent' => (float) $current['relative_humidity_2m'],
                'precipitation_mm' => (float) $current['precipitation'],
                'precipitation_period_minutes' => (int) ($current['interval'] / 60),
                'last_successful_update' => now()->toIso8601String(),
                'stale' => false,
            ];
            Cache::put('weather:calamba:current', $weather, now()->addMinutes(10));
            Cache::put('weather:calamba:last-success', $weather, now()->addDay());

            return $weather;
        } catch (Throwable $exception) {
            if ($last = Cache::get('weather:calamba:last-success')) {
                return [...$last, 'stale' => true];
            }

            throw new RuntimeException('Current weather is unavailable. Please try again later.', previous: $exception);
        }
    }

    /** @return array<string, mixed> */
    public function syncMonth(int $year, int $month): array
    {
        $start = CarbonImmutable::create($year, $month, 1, 0, 0, 0, self::TIMEZONE)->startOfMonth();
        if ($start->greaterThanOrEqualTo(CarbonImmutable::now(self::TIMEZONE)->startOfMonth())) {
            throw new RuntimeException('Only completed past months can be synchronized.');
        }
        $response = Http::acceptJson()->timeout(30)->get(config('services.open_meteo.archive_url'), [
            'latitude' => config('services.open_meteo.latitude'),
            'longitude' => config('services.open_meteo.longitude'),
            'timezone' => self::TIMEZONE,
            'start_date' => $start->toDateString(),
            'end_date' => $start->endOfMonth()->toDateString(),
            'hourly' => 'temperature_2m,relative_humidity_2m,precipitation',
            'temperature_unit' => 'celsius',
            'precipitation_unit' => 'mm',
        ]);
        if (! $response->successful()) {
            throw new RuntimeException('Historical weather request failed.');
        }
        $result = $this->aggregateMonth($response->json(), $year, $month);
        if (! Storage::disk('local')->put('weather/monthly/'.$start->format('Y-m').'.json', json_encode($result, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR))) {
            throw new RuntimeException('Historical weather could not be saved.');
        }

        return $result;
    }

    /** @return array<string, mixed> */
    public function completeHistoricalMonth(int $year, int $month): array
    {
        $key = sprintf('%04d-%02d', $year, $month);
        $path = 'weather/monthly/'.$key.'.json';
        $data = Storage::disk('local')->exists($path)
            ? json_decode(Storage::disk('local')->get($path), true)
            : $this->syncMonth($year, $month);

        if (! is_array($data)
            || ($data['month'] ?? null) !== $key
            || ($data['timezone'] ?? null) !== self::TIMEZONE
            || ($data['source'] ?? null) !== 'Open-Meteo historical reanalysis/model estimates'
            || ($data['completeness']['complete'] ?? null) !== true
            || ! is_numeric($data['monthly_avg_temp_c'] ?? null)
            || ! is_numeric($data['monthly_avg_humidity_percent'] ?? null)
            || ! is_numeric($data['monthly_total_rainfall_mm'] ?? null)) {
            throw new RuntimeException('Complete historical weather is unavailable for this scenario.');
        }

        return $data;
    }

    /** @return array<string, mixed> */
    public function aggregateMonth(mixed $body, int $year, int $month): array
    {
        $start = CarbonImmutable::create($year, $month, 1, 0, 0, 0, self::TIMEZONE)->startOfMonth();
        $hourly = is_array($body) ? ($body['hourly'] ?? null) : null;
        $units = is_array($body) ? ($body['hourly_units'] ?? null) : null;
        if (($body['timezone'] ?? null) !== self::TIMEZONE || ! is_array($hourly) || ! is_array($units)
            || ($units['temperature_2m'] ?? null) !== '°C'
            || ($units['relative_humidity_2m'] ?? null) !== '%'
            || ($units['precipitation'] ?? null) !== 'mm'
            || ! is_array($hourly['time'] ?? null)) {
            throw new RuntimeException('Historical weather response is invalid.');
        }
        $times = $hourly['time'];
        $expected = $start->daysInMonth * 24;
        $counts = ['temperature_2m' => 0, 'relative_humidity_2m' => 0, 'precipitation' => 0];
        $sums = array_fill_keys(array_keys($counts), 0.0);
        foreach ($times as $index => $time) {
            if (! is_string($time) || ! preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:00$/', $time)
                || $time !== $start->addHours($index)->format('Y-m-d\TH:00')) {
                throw new RuntimeException('Historical weather timestamps are invalid.');
            }
            foreach (array_keys($counts) as $key) {
                $value = $hourly[$key][$index] ?? null;
                if ($value === null) {
                    continue;
                }
                if (! is_numeric($value) || ($key === 'relative_humidity_2m' && ($value < 0 || $value > 100))
                    || ($key === 'precipitation' && $value < 0)) {
                    throw new RuntimeException('Historical weather values are invalid.');
                }
                $counts[$key]++;
                $sums[$key] += (float) $value;
            }
        }
        $complete = count($times) === $expected && min($counts) === $expected;

        return [
            'month' => $start->format('Y-m'),
            'timezone' => self::TIMEZONE,
            'source' => 'Open-Meteo historical reanalysis/model estimates',
            'monthly_avg_temp_c' => $counts['temperature_2m'] ? round($sums['temperature_2m'] / $counts['temperature_2m'], 2) : null,
            'monthly_avg_humidity_percent' => $counts['relative_humidity_2m'] ? round($sums['relative_humidity_2m'] / $counts['relative_humidity_2m'], 2) : null,
            'monthly_total_rainfall_mm' => $counts['precipitation'] ? round($sums['precipitation'], 2) : null,
            'completeness' => ['expected_hours' => $expected, 'available_hours' => $counts, 'complete' => $complete],
            'observation_period' => ['start' => $start->toDateString(), 'end' => $start->endOfMonth()->toDateString()],
            'last_updated' => now()->toIso8601String(),
            'model_compatible' => false,
        ];
    }
}
