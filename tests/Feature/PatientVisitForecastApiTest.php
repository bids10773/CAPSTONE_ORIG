<?php

use App\Models\Appointment;
use App\Models\User;
use Carbon\CarbonImmutable;

function createVolumeVisit(User $patient, CarbonImmutable $date, array $attributes = []): Appointment
{
    return Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => $date,
        'start_time' => '09:00',
        'end_time' => '09:30',
        'type' => 'individual',
        'status' => 'completed',
        'arrived_at' => $date->setTime(9, 0),
        'service_types' => ['PE'],
        ...$attributes,
    ]);
}

it('summarizes actual attended visits without duplicate or invalid counts', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    $today = CarbonImmutable::today();

    createVolumeVisit($patient, $today);
    createVolumeVisit($patient, $today, ['status' => 'cancelled']);
    createVolumeVisit($patient, $today, ['status' => 'pending', 'arrived_at' => null]);
    createVolumeVisit($patient, $today, ['type' => 'company_bulk', 'bulk_appointment_id' => null]);
    $parent = createVolumeVisit($patient, $today->subDay(), ['type' => 'company_bulk', 'bulk_appointment_id' => null]);
    createVolumeVisit($patient, $today, [
        'type' => 'company_bulk',
        'bulk_appointment_id' => $parent->id,
        'attendance_status' => 'arrived',
    ]);

    $this->actingAs($admin)
        ->getJson('/analytics/api/patient-volume?start_date='.$today->subDay()->format('Y-m-d').'&end_date='.$today->format('Y-m-d'))
        ->assertOk()
        ->assertJsonPath('meta.source', 'Actual attended appointment records')
        ->assertJsonPath('summary.total_patients_today', 2)
        ->assertJsonPath('summary.selected_period_visits', 2)
        ->assertJsonPath('summary.selected_period_unique_patients', 1)
        ->assertJsonPath('overview.total_appointments', 6)
        ->assertJsonPath('overview.status_breakdown.completed', 4)
        ->assertJsonPath('overview.service_type_count', 1)
        ->assertJsonPath('daily.forecast.available', false)
        ->assertJsonCount(2, 'daily.history');

    createVolumeVisit($patient, $today);

    $this->actingAs($admin)
        ->getJson('/analytics/api/patient-volume?start_date='.$today->subDay()->format('Y-m-d').'&end_date='.$today->format('Y-m-d'))
        ->assertOk()
        ->assertJsonPath('summary.total_patients_today', 3)
        ->assertJsonPath('summary.selected_period_visits', 3);
});

it('serves one combined analytics page and redirects the old patient volume page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get('/admin/analytics')
        ->assertOk()
        ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('admin/patient-visits/index')
            ->has('initialData.overview')
            ->has('initialData.summary')
            ->has('initialData.daily.forecast')
            ->has('initialData.monthly.forecast'));

    $this->actingAs($admin)
        ->get('/analytics/patient-volume')
        ->assertRedirect('/admin/analytics');
});

it('generates daily and monthly Holt-Winters forecasts when history is sufficient', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    $end = CarbonImmutable::today()->startOfMonth()->subMonth();
    $start = $end->subMonths(23);

    for ($month = 0; $month < 24; $month++) {
        $date = $start->addMonths($month);
        $count = 2 + ($month % 4);
        for ($visit = 0; $visit < $count; $visit++) {
            createVolumeVisit($patient, $date->addDays($visit));
        }
    }

    $this->actingAs($admin)
        ->getJson('/analytics/api/patient-volume?'.http_build_query([
            'start_date' => $start->format('Y-m-d'),
            'end_date' => $end->endOfMonth()->format('Y-m-d'),
            'daily_horizon' => 7,
            'monthly_horizon' => 3,
        ]))
        ->assertOk()
        ->assertJsonPath('daily.forecast.available', true)
        ->assertJsonPath('monthly.forecast.available', true)
        ->assertJsonCount(7, 'daily.forecast.data')
        ->assertJsonCount(3, 'monthly.forecast.data')
        ->assertJsonPath('monthly.forecast.data.0.period', $end->addMonth()->format('Y-m'))
        ->assertJsonPath('monthly.forecast.parameters.method', 'Additive Holt-Winters triple exponential smoothing');
});

it('allows admins but blocks all non-admin roles', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $doctor = User::factory()->create(['role' => 'doctor']);

    $this->actingAs($admin)->getJson('/analytics/api/patient-volume')->assertOk();

    foreach (['doctor', 'medtech', 'radtech', 'receptionist', 'patient'] as $role) {
        $user = $role === 'doctor'
            ? $doctor
            : User::factory()->create(['role' => $role]);

        $this->actingAs($user)->getJson('/analytics/api/patient-volume')->assertForbidden();
    }
});

it('validates date ranges and supported forecast horizons', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->getJson('/analytics/api/patient-volume?daily_horizon=9&monthly_horizon=5')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['daily_horizon', 'monthly_horizon']);
});
