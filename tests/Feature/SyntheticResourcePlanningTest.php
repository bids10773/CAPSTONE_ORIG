<?php

use App\Models\User;
use App\Services\SyntheticResourcePlanningService;
use Illuminate\Support\Facades\Http;

function planningForecast(string $month, int $dengue): array
{
    $diseases = ['Dengue', 'Leptospirosis', 'Influenza_ILI', 'Typhoid', 'Cholera', 'Heat_Stroke', 'Food_Poisoning', 'Sore_Eyes'];

    return [
        'forecast_month' => $month,
        'data_type' => 'Synthetic Simulation',
        'validated_on_real_data' => false,
        'weather_assumption' => 'Synthetic 2025 weather proxy',
        'predictions' => array_map(fn ($disease) => [
            'disease' => $disease,
            'predicted_cases' => $disease === 'Dengue' ? $dengue : 10,
            'method' => 'Random Forest',
        ], $diseases),
    ];
}

it('uses each selected forecast and workbook mappings with separate synthetic stock scenarios', function () {
    config()->set('services.lmic_ml.url', 'http://ml.internal:8001');
    Http::fake(fn ($request) => Http::response(match (parse_url($request->url(), PHP_URL_QUERY)) {
        'year=2026&month=10' => planningForecast('October 2026', 47),
        'year=2026&month=11' => planningForecast('November 2026', 20),
        'year=2026&month=12' => planningForecast('December 2026', 30),
    }));
    $this->actingAs(User::factory()->create(['role' => 'admin']));

    $october = $this->getJson('/admin/api/forecast/resources?year=2026&month=10')->assertOk()
        ->assertJsonPath('clinic_approved', 'No')
        ->assertJsonPath('predictions.0.predicted_cases', 47)
        ->assertJsonPath('services.0.expected_clinic_cases', 7.05)
        ->assertJsonPath('services.0.expected_services', 4.94)
        ->assertJsonPath('services.0.required_units', 5)
        ->assertJsonPath('supplies.0.opening_stock', 8)
        ->assertJsonPath('supplies.0.projected_remaining_stock', 3)
        ->assertJsonPath('supplies.0.replenishment_gap', 2)
        ->assertJsonPath('supplies.0.status', 'Potential Shortage in Simulation')
        ->json();
    expect($october['services'])->toHaveCount(8)
        ->and($october['supplies'])->toHaveCount(8);

    $this->getJson('/admin/api/forecast/resources?year=2026&month=11')->assertOk()
        ->assertJsonPath('forecast_month', 'November 2026')
        ->assertJsonPath('predictions.0.predicted_cases', 20)
        ->assertJsonPath('supplies.0.opening_stock', 11);
    $this->getJson('/admin/api/forecast/resources?year=2026&month=12')->assertOk()
        ->assertJsonPath('forecast_month', 'December 2026')
        ->assertJsonPath('predictions.0.predicted_cases', 30)
        ->assertJsonPath('supplies.0.opening_stock', 14);

});

it('aggregates shared supplies once and handles absent scenarios', function () {
    $service = app(SyntheticResourcePlanningService::class);
    $mapping = json_decode(file_get_contents(resource_path('data/synthetic-resource-mappings.json')), true)[0];
    $other = $mapping;
    $other['Disease'] = 'Other';
    $forecast = ['forecast_month' => 'October 2026', 'predictions' => [
        ['disease' => 'Dengue', 'predicted_cases' => 47, 'method' => 'Random Forest'],
        ['disease' => 'Other', 'predicted_cases' => 47, 'method' => 'Random Forest'],
    ]];
    $scenario = [[
        'Forecast_Month' => '2026-10', 'Supply_Item' => 'EDTA collection tubes',
        'Opening_Stock' => 8, 'Safety_Stock' => 5, 'Unit' => 'tubes',
        'Data_Type' => 'Synthetic Simulation', 'Clinic_Approved' => 'No',
    ]];
    $result = $service->calculate($forecast, [$mapping, $other], $scenario, '2026-10');
    expect($result['supplies'])->toHaveCount(1)
        ->and($result['supplies'][0]['required_units'])->toBe(10)
        ->and($result['supplies'][0]['projected_remaining_stock'])->toBe(-2)
        ->and($result['supplies'][0]['replenishment_gap'])->toBe(7);

    $missing = $service->calculate($forecast, [$mapping, $other], [], '2026-10');
    expect($missing['supplies'][0]['status'])->toBe('No Inventory Scenario')
        ->and($missing['supplies'][0]['opening_stock'])->toBeNull();
    expect(fn () => $service->calculate($forecast, [$mapping], $scenario, '2026-10'))
        ->toThrow(InvalidArgumentException::class);
});

it('restricts resource planning to administrators and configured months', function () {
    $this->actingAs(User::factory()->create(['role' => 'patient']))
        ->getJson('/admin/api/forecast/resources?year=2026&month=10')->assertForbidden();
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->getJson('/admin/api/forecast/resources?year=2026&month=9')
        ->assertUnprocessable()->assertJsonValidationErrors('month');
});

it('keeps every planning fixture unapproved and reports an unavailable forecast service', function () {
    foreach (['synthetic-resource-mappings.json', 'synthetic-resource-scenarios.json'] as $name) {
        $rows = json_decode(file_get_contents(resource_path('data/'.$name)), true);
        expect($rows)->not->toBeEmpty();
        foreach ($rows as $row) {
            expect($row['Clinic_Approved'])->toBe('No')
                ->and($row['Data_Type'])->toBe('Synthetic Simulation');
        }
    }

    Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('Connection refused'));
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->getJson('/admin/api/forecast/resources?year=2026&month=10')
        ->assertStatus(503)->assertJsonStructure(['message']);
});
