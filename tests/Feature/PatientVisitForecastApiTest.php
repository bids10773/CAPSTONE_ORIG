<?php

use App\Models\User;

it('returns the labeled sixty-month patient visit demo and forecast', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->getJson('/admin/api/patient-visits?horizon=6')
        ->assertOk()
        ->assertJsonPath('meta.is_demo', true)
        ->assertJsonPath('meta.label', 'Sample Data · Demo Patient Visits')
        ->assertJsonCount(60, 'history')
        ->assertJsonCount(6, 'forecast')
        ->assertJsonCount(5, 'yearly_comparison')
        ->assertJsonCount(6, 'distribution')
        ->assertJsonStructure([
            'summary' => [
                'total_visits',
                'average_monthly_visits',
                'highest_month',
                'lowest_month',
                'predicted_next_month',
                'percentage_change',
            ],
            'model' => ['metrics', 'seasonal_pattern'],
            'category_forecasts',
            'insights',
        ]);
});

it('filters demo history by year and validates supported horizons', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->getJson('/admin/api/patient-visits?year=2023&horizon=3')
        ->assertOk()
        ->assertJsonCount(12, 'history')
        ->assertJsonCount(3, 'forecast')
        ->assertJsonPath('filters.year', 2023);

    $this->actingAs($admin)
        ->getJson('/admin/api/patient-visits?horizon=9')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('horizon');
});

it('keeps patient visit analytics admin only', function () {
    $patient = User::factory()->create(['role' => 'patient']);

    $this->actingAs($patient)->getJson('/admin/api/patient-visits')->assertForbidden();
});
