<?php

use App\Models\Appointment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createPaginatedAppointments(User $patient, int $count, array $overrides = []): void
{
    foreach (range(1, $count) as $index) {
        Appointment::create(array_merge([
            'user_id' => $patient->id,
            'appointment_date' => now()->addMinutes($index),
            'type' => 'individual',
            'status' => 'pending',
            'service_types' => ['PE'],
        ], $overrides));
    }
}

test('patient appointments support validated page sizes and preserve authorization scope', function () {
    $patient = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    $other = User::factory()->create(['role' => 'patient', 'email_verified_at' => now()]);
    createPaginatedAppointments($patient, 30);
    createPaginatedAppointments($other, 5);

    $this->actingAs($patient)
        ->get(route('appointments.index', ['per_page' => 25, 'status' => 'pending']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.per_page', 25)
            ->where('appointments.total', 30)
            ->has('appointments.data', 25)
            ->where('filters.status', 'pending'));

    $this->actingAs($patient)
        ->get(route('appointments.index', ['per_page' => 5000]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.per_page', 15)
            ->has('appointments.data', 15));
});

test('receptionist queue paginates online records before walk-ins', function () {
    $staff = User::factory()->create(['role' => 'receptionist']);
    $patient = User::factory()->create(['role' => 'patient']);
    createPaginatedAppointments($patient, 12, ['type' => 'walk_in']);
    createPaginatedAppointments($patient, 12, ['type' => 'individual', 'status' => 'accepted']);

    $this->actingAs($staff)
        ->get(route('receptionist.queue.index', ['per_page' => 10]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('walkIns.total', 24)
            ->where('walkIns.per_page', 10)
            ->has('walkIns.data', 10)
            ->where('walkIns.data.0.type', 'individual'));
});

test('admin report detail table is paginated without changing aggregate totals', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    createPaginatedAppointments($patient, 26);

    $this->actingAs($admin)
        ->get(route('admin.reports', ['per_page' => 10, 'page' => 2]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('totalAppointments', 26)
            ->where('recentAppointments.total', 26)
            ->where('recentAppointments.current_page', 2)
            ->has('recentAppointments.data', 10));
});
