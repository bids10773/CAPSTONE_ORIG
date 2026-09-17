<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class MonthlyMlForecastService
{
    /** @return array<string, mixed> */
    public function get(int $year, int $month): array
    {
        $response = Http::acceptJson()
            ->connectTimeout(3)
            ->timeout(30)
            ->get(rtrim(config('services.lmic_ml.url'), '/').'/forecast', [
                'year' => $year,
                'month' => $month,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('The ML service returned an unsuccessful response.');
        }

        $data = $response->json();
        $predictions = $this->predictions($data, $year, $month);

        return [
            'forecast_month' => $data['forecast_month'],
            'data_type' => $data['data_type'],
            'validated_on_real_data' => false,
            'weather_assumption' => 'Synthetic 2025 weather proxy',
            'predictions' => $predictions,
        ];
    }

    /** @return array<string, mixed> */
    public function weatherScenario(int $year, int $month, array $weather): array
    {
        $sourceMonth = $weather['month'];
        $response = Http::acceptJson()->timeout(45)
            ->post(rtrim(config('services.lmic_ml.url'), '/').'/forecast/weather-scenario', [
                'year' => $year,
                'month' => $month,
                'source_month' => $sourceMonth,
                'avg_temp_c' => $weather['monthly_avg_temp_c'],
                'avg_humidity_percent' => $weather['monthly_avg_humidity_percent'],
                'total_rainfall_mm' => $weather['monthly_total_rainfall_mm'],
            ]);
        if (! $response->successful()) {
            throw new RuntimeException('The ML weather scenario request failed.');
        }
        $data = $response->json();
        $predictions = $this->predictions($data, $year, $month);
        if (($data['weather_source_month'] ?? null) !== $sourceMonth
            || ($data['weather_source'] ?? null) !== 'Open-Meteo historical reanalysis/model estimates'
            || ($data['scenario_only'] ?? null) !== true) {
            throw new RuntimeException('The ML weather scenario response is invalid.');
        }

        return [
            'forecast_month' => $data['forecast_month'],
            'data_type' => 'Synthetic Simulation',
            'validated_on_real_data' => false,
            'weather_assumption' => 'Open-Meteo 2025 historical analog for selected month’s lagged weather',
            'weather_source' => $data['weather_source'],
            'weather_source_month' => $sourceMonth,
            'weather_values' => [
                'monthly_avg_temp_c' => $weather['monthly_avg_temp_c'],
                'monthly_avg_humidity_percent' => $weather['monthly_avg_humidity_percent'],
                'monthly_total_rainfall_mm' => $weather['monthly_total_rainfall_mm'],
            ],
            'scenario_only' => true,
            'predictions' => $predictions,
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function predictions(mixed $data, int $year, int $month): array
    {
        if (! is_array($data)
            || ($data['forecast_month'] ?? null) !== \Carbon\CarbonImmutable::create($year, $month, 1)->format('F Y')
            || ($data['data_type'] ?? null) !== 'Synthetic Simulation'
            || ($data['validated_on_real_data'] ?? null) !== false
            || ! is_array($data['predictions'] ?? null)
            || count($data['predictions']) !== 8) {
            throw new RuntimeException('The ML service returned invalid forecast data.');
        }

        $names = [];
        foreach ($data['predictions'] as $prediction) {
            if (! is_array($prediction)
                || ! is_string($prediction['disease'] ?? null)
                || ($prediction['disease'] ?? '') === ''
                || ! is_int($prediction['predicted_cases'] ?? null)
                || $prediction['predicted_cases'] < 0
                || ! in_array($prediction['method'] ?? null, ['Random Forest', 'Previous Year Baseline'], true)) {
                throw new RuntimeException('The ML service returned invalid predictions.');
            }
            $names[] = $prediction['disease'];
        }

        if (count(array_unique($names)) !== 8) {
            throw new RuntimeException('The ML service returned duplicate predictions.');
        }

        return array_values($data['predictions']);
    }
}
