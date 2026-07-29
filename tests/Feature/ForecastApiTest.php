<?php

use App\Models\User;

it('allows administrators to view the demo forecast dashboard', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->getJson('/admin/api/forecast?horizon=6&disease=Hypertension')
        ->assertOk()
        ->assertJsonPath('meta.is_demo', true)
        ->assertJsonPath('filters.horizon', 6)
        ->assertJsonCount(1, 'diseases')
        ->assertJsonCount(6, 'diseases.0.forecast')
        ->assertJsonStructure([
            'summary',
            'history',
            'diseases' => [[
                'disease', 'history', 'forecast', 'seasonal_pattern',
                'metrics' => ['level', 'trend', 'rmse', 'growth_percentage', 'direction'],
                'explanation',
            ]],
        ]);
});

it('rejects invalid forecast filters', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->getJson('/admin/api/forecast?horizon=0&alpha=2')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['horizon', 'alpha']);
});

it('prevents non administrators from accessing forecasts', function () {
    $patient = User::factory()->create(['role' => 'patient']);

    $this->actingAs($patient)->getJson('/admin/api/forecast')->assertForbidden();
});
