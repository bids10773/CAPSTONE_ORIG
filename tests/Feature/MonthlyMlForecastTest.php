<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

function monthlyMlPayload(string $month): array
{
    return [
        'forecast_month' => $month,
        'data_type' => 'Synthetic Simulation',
        'validated_on_real_data' => false,
        'weather_assumption' => 'Synthetic 2025 weather proxy',
        'predictions' => collect([
            'Dengue' => 47, 'Leptospirosis' => 12, 'Influenza_ILI' => 54,
            'Typhoid' => 12, 'Cholera' => 5, 'Heat_Stroke' => 3,
            'Food_Poisoning' => 11, 'Sore_Eyes' => 7,
        ])->map(fn ($cases, $disease) => [
            'disease' => $disease,
            'predicted_cases' => $cases,
            'method' => in_array($disease, ['Heat_Stroke', 'Sore_Eyes']) ? 'Previous Year Baseline' : 'Random Forest',
        ])->values()->all(),
    ];
}

it('retrieves each selected 2026 month', function () {
    config()->set('services.lmic_ml.url', 'http://ml.internal:8001');
    Http::fake(fn ($request) => Http::response(monthlyMlPayload(match ($request->url()) {
        'http://ml.internal:8001/forecast?year=2026&month=10' => 'October 2026',
        'http://ml.internal:8001/forecast?year=2026&month=11' => 'November 2026',
        'http://ml.internal:8001/forecast?year=2026&month=12' => 'December 2026',
        default => 'Unexpected',
    })));
    $this->actingAs(User::factory()->create(['role' => 'admin']));

    $this->get('/admin/forecast')->assertOk();

    foreach ([10 => 'October 2026', 11 => 'November 2026', 12 => 'December 2026'] as $month => $label) {
        $this->getJson("/admin/api/forecast/monthly?year=2026&month={$month}")
            ->assertOk()->assertJsonPath('forecast_month', $label)
            ->assertJsonCount(8, 'predictions');
    }

    $this->getJson('/admin/api/forecast/history')->assertNotFound();
    $this->getJson('/admin/api/forecast')->assertNotFound();
});

it('rejects unsupported dates and non administrators', function () {
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->getJson('/admin/api/forecast/monthly?year=2027&month=10')
        ->assertUnprocessable()->assertJsonValidationErrors('year');
    $this->getJson('/admin/api/forecast/monthly?year=2026&month=13')
        ->assertUnprocessable()->assertJsonValidationErrors('month');

    $this->actingAs(User::factory()->create(['role' => 'patient']))
        ->getJson('/admin/api/forecast/monthly?year=2026&month=10')->assertForbidden();
});

it('handles an unavailable or malformed ML service', function () {
    $this->actingAs(User::factory()->create(['role' => 'admin']));
    Http::fake(['*/forecast*' => Http::response(['predictions' => []])]);
    $this->getJson('/admin/api/forecast/monthly?year=2026&month=10')
        ->assertStatus(502)->assertJsonStructure(['message']);

    Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('Connection refused'));
    $this->getJson('/admin/api/forecast/monthly?year=2026&month=10')
        ->assertStatus(503)->assertJsonStructure(['message']);
});
