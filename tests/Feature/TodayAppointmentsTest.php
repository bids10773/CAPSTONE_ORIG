<?php

use App\Models\Appointment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createTodayAppointment(User $patient, array $attributes = []): Appointment
{
    return Appointment::create(array_merge([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'start_time' => '08:00',
        'end_time' => '08:30',
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['CBC'],
    ], $attributes));
}

test("today's appointments returns an empty queue without falling back to other dates", function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    createTodayAppointment($patient, ['appointment_date' => today()->subDay(), 'status' => 'completed']);
    createTodayAppointment($patient, ['appointment_date' => today()->addDay()]);

    $this->actingAs($admin)->get(route('admin.appointments.today'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/appointments/today')
            ->where('today', today()->toDateString())
            ->where('appointments.total', 0)
            ->has('appointments.data', 0)
            ->where('summary.total', 0));
});

test("today's appointments includes active and completed patients but excludes cancelled and rejected records", function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    $accepted = createTodayAppointment($patient);
    createTodayAppointment($patient, ['status' => 'completed', 'start_time' => '09:00']);
    createTodayAppointment($patient, ['status' => 'cancelled', 'start_time' => '10:00']);
    createTodayAppointment($patient, ['status' => 'rejected', 'start_time' => '11:00']);

    $this->actingAs($admin)->get(route('admin.appointments.today'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 2)
            ->where('appointments.data.0.id', $accepted->id)
            ->where('summary.total', 2)
            ->where('summary.waiting', 1)
            ->where('summary.completed', 1));
});

test("today's patient search cannot escape the appointment date restriction", function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $juan = User::factory()->create(['role' => 'patient', 'first_name' => 'Juan', 'last_name' => 'Dela Cruz']);
    $maria = User::factory()->create(['role' => 'patient', 'first_name' => 'Maria', 'last_name' => 'Santos']);
    createTodayAppointment($juan, ['appointment_date' => today()->subDay()]);
    createTodayAppointment($maria);

    $this->actingAs($admin)->get(route('admin.appointments.today', ['search' => 'Juan']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 0)
            ->has('appointments.data', 0)
            ->where('filters.search', 'Juan'));

    $this->get(route('admin.appointments.today', ['search' => 'Maria']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 1)
            ->where('appointments.data.0.user.id', $maria->id));
});

test("today's queue includes walk-ins and reflects arrival updates", function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    $walkIn = createTodayAppointment($patient, [
        'type' => 'walk_in',
        'status' => 'accepted',
        'start_time' => null,
        'arrived_at' => now(),
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.appointments.update-status', $walkIn), ['status' => 'arrived'])
        ->assertSessionHasNoErrors();

    $this->get(route('admin.appointments.today'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 1)
            ->where('appointments.data.0.type', 'walk_in')
            ->where('appointments.data.0.status', 'arrived')
            ->where('summary.in_progress', 1));
});

test("patients cannot access the clinic-wide today's appointments queue", function () {
    $patient = User::factory()->create(['role' => 'patient']);

    $this->actingAs($patient)
        ->get('/admin/todays-appointments')
        ->assertForbidden();
});
