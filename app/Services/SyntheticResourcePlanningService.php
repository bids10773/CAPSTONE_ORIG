<?php

namespace App\Services;

use InvalidArgumentException;
use RuntimeException;

class SyntheticResourcePlanningService
{
    public function __construct(private readonly MonthlyMlForecastService $forecast) {}

    /** @return array<string, mixed> */
    public function plan(int $year, int $month): array
    {
        $forecast = $this->forecast->get($year, $month);
        $mappings = $this->readFixture('synthetic-resource-mappings.json');
        $scenarios = $this->readFixture('synthetic-resource-scenarios.json');

        return $this->calculate($forecast, $mappings, $scenarios, sprintf('%04d-%02d', $year, $month));
    }

    /** @return array<string, mixed> */
    public function calculate(array $forecast, array $mappings, array $scenarios, string $forecastMonth): array
    {
        $predictions = $forecast['predictions'] ?? [];
        $byDisease = [];
        foreach ($mappings as $mapping) {
            if (! is_array($mapping)
                || ! is_string($mapping['Disease'] ?? null)
                || ! $this->validRate($mapping['Clinic_Capture_Rate'] ?? null)
                || ! $this->validRate($mapping['Service_Utilization_Rate'] ?? null)
                || ! is_numeric($mapping['Units_Per_Service'] ?? null)
                || (float) $mapping['Units_Per_Service'] <= 0
                || ! is_string($mapping['Service_Name'] ?? null)
                || ! is_string($mapping['Equipment_Name'] ?? null)
                || ! is_string($mapping['Supply_Item'] ?? null)
                || ($mapping['Clinic_Approved'] ?? null) !== 'No'
                || ($mapping['Data_Type'] ?? null) !== 'Synthetic Simulation') {
                throw new InvalidArgumentException('Synthetic resource mappings are incomplete or invalid.');
            }
            $byDisease[$mapping['Disease']][] = $mapping;
        }

        $services = [];
        $requirements = [];
        foreach ($predictions as $prediction) {
            $disease = $prediction['disease'];
            if (empty($byDisease[$disease])) {
                throw new InvalidArgumentException('A synthetic resource mapping is missing for '.$disease.'.');
            }
            foreach ($byDisease[$disease] as $mapping) {
                $clinicCases = $prediction['predicted_cases'] * (float) $mapping['Clinic_Capture_Rate'];
                $expectedServices = $clinicCases * (float) $mapping['Service_Utilization_Rate'];
                $requiredUnits = (int) ceil($expectedServices * (float) $mapping['Units_Per_Service']);
                $supply = $mapping['Supply_Item'];
                $requirements[$supply] = ($requirements[$supply] ?? 0) + $requiredUnits;
                $services[] = [
                    'disease' => $disease,
                    'predicted_cases' => $prediction['predicted_cases'],
                    'expected_clinic_cases' => round($clinicCases, 2),
                    'service' => $mapping['Service_Name'],
                    'expected_services' => round($expectedServices, 2),
                    'equipment' => $mapping['Equipment_Name'],
                    'supply_item' => $supply,
                    'required_units' => $requiredUnits,
                    'mapping_source' => $mapping['Source'] ?? 'Synthetic mapping fixture',
                ];
            }
        }

        $stockBySupply = [];
        foreach ($scenarios as $scenario) {
            if (($scenario['Forecast_Month'] ?? null) !== $forecastMonth) {
                continue;
            }
            $supply = $scenario['Supply_Item'] ?? null;
            if (! is_string($supply) || isset($stockBySupply[$supply])
                || ! is_int($scenario['Opening_Stock'] ?? null) || $scenario['Opening_Stock'] < 0
                || ! is_int($scenario['Safety_Stock'] ?? null) || $scenario['Safety_Stock'] < 0
                || ! is_string($scenario['Unit'] ?? null)
                || ($scenario['Clinic_Approved'] ?? null) !== 'No'
                || ($scenario['Data_Type'] ?? null) !== 'Synthetic Simulation') {
                throw new InvalidArgumentException('Synthetic inventory scenario is incomplete or invalid.');
            }
            $stockBySupply[$supply] = $scenario;
        }

        $supplies = [];
        foreach ($requirements as $supply => $units) {
            $scenario = $stockBySupply[$supply] ?? null;
            $opening = $scenario['Opening_Stock'] ?? null;
            $safety = $scenario['Safety_Stock'] ?? null;
            $gap = $scenario ? max(0, $units + $safety - $opening) : null;
            $supplies[] = [
                'supply_item' => $supply,
                'required_units' => $units,
                'opening_stock' => $opening,
                'safety_stock' => $safety,
                'projected_remaining_stock' => $scenario ? $opening - $units : null,
                'replenishment_gap' => $gap,
                'unit' => $scenario['Unit'] ?? null,
                'status' => ! $scenario ? 'No Inventory Scenario' : ($gap > 0 ? 'Potential Shortage in Simulation' : 'Sufficient in Simulation'),
            ];
        }

        return [
            'validated_on_real_data' => false,
            'weather_assumption' => $forecast['weather_assumption'] ?? 'Synthetic 2025 weather proxy',
            'forecast_month' => $forecast['forecast_month'],
            'data_type' => 'Synthetic Simulation',
            'clinic_approved' => 'No',
            'mapping_source' => 'Colab_Ready workbook snapshot; January forecast and stock columns excluded',
            'inventory_source' => 'Independent hypothetical monthly fixture',
            'predictions' => $predictions,
            'services' => $services,
            'supplies' => $supplies,
        ];
    }

    private function validRate(mixed $value): bool
    {
        return is_numeric($value) && (float) $value >= 0 && (float) $value <= 1;
    }

    private function readFixture(string $name): array
    {
        $contents = @file_get_contents(resource_path('data/'.$name));
        if ($contents === false) {
            throw new RuntimeException('Synthetic planning fixture is unavailable.');
        }
        $data = json_decode($contents, true);
        if (! is_array($data) || ! array_is_list($data)) {
            throw new RuntimeException('Synthetic planning fixture is invalid.');
        }

        return $data;
    }
}
