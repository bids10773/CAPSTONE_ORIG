<?php

use App\Models\Appointment;
use App\Models\User;
use App\Notifications\AppointmentSubmitted;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => Carbon::setTestNow('2026-08-17 08:00:00'));
afterEach(fn () => Carbon::setTestNow());

function notificationPatient(): User
{
    $patient = User::factory()->create(['role' => 'patient']);
    $patient->patientProfile()->create(['birthdate' => '1994-06-15', 'sex' => 'female']);

    return $patient;
}

function notificationDoctor(): User
{
    return User::factory()->create([
        'role' => 'doctor',
        'is_active' => true,
        'availability' => [['day' => 'tue', 'start' => '08:00', 'end' => '12:00']],
    ]);
}

function notificationAppointment(User $patient, User $doctor): Appointment
{
    return Appointment::create([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => '2026-08-18',
        'start_time' => '08:00',
        'end_time' => '08:30',
        'type' => 'individual',
        'status' => 'pending',
        'service_types' => ['CBC'],
    ]);
}

test('appointment submission stores role-aware admin and patient notifications', function () {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $otherRole = User::factory()->create(['role' => 'receptionist', 'is_active' => true]);
    $patient = notificationPatient();
    $doctor = notificationDoctor();

    $this->actingAs($patient)->post(route('appointments.store'), [
        'type' => 'individual', 'doctor_id' => $doctor->id, 'appointment_date' => '2026-08-18',
        'start_time' => '08:00', 'service_types' => ['CBC'],
    ])->assertSessionHasNoErrors();

    expect($admin->unreadNotifications()->count())->toBe(1)
        ->and($admin->unreadNotifications()->first()->data['type'])->toBe('appointment_request')
        ->and($patient->unreadNotifications()->count())->toBe(1)
        ->and($patient->unreadNotifications()->first()->data['type'])->toBe('appointment_submitted')
        ->and($doctor->notifications()->count())->toBe(0)
        ->and($otherRole->notifications()->count())->toBe(0);
});

test('approval creates exactly one patient confirmation and one doctor assignment', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = notificationPatient();
    $doctor = notificationDoctor();
    $appointment = notificationAppointment($patient, $doctor);

    $this->actingAs($admin)->patch(route('admin.appointments.approve', $appointment))->assertSessionHasNoErrors();

    expect($patient->notifications()->where('data->type', 'appointment_confirmed')->count())->toBe(1)
        ->and($doctor->notifications()->where('data->type', 'appointment_assigned')->count())->toBe(1);
});

test('authenticated user can mark one or all of only their own notifications as read', function () {
    $patient = notificationPatient();
    $other = notificationPatient();
    $doctor = notificationDoctor();
    $patient->notify(new AppointmentSubmitted(notificationAppointment($patient, $doctor)));
    $patient->notify(new AppointmentSubmitted(notificationAppointment($patient, $doctor)));
    $other->notify(new AppointmentSubmitted(notificationAppointment($other, $doctor)));
    $first = $patient->unreadNotifications()->first();

    $this->actingAs($patient)->patch(route('notifications.read', $first->id))->assertRedirect();
    expect($patient->unreadNotifications()->count())->toBe(1);

    $this->patch(route('notifications.read', $other->unreadNotifications()->first()->id))->assertNotFound();
    expect($other->unreadNotifications()->count())->toBe(1);

    $this->patch(route('notifications.read-all'))->assertRedirect();
    expect($patient->unreadNotifications()->count())->toBe(0)
        ->and($other->unreadNotifications()->count())->toBe(1);
});

test('notification center is paginated and shared bell count uses real unread records', function () {
    $patient = notificationPatient();
    $appointment = notificationAppointment($patient, notificationDoctor());
    foreach (range(1, 16) as $_) {
        $patient->notify(new AppointmentSubmitted($appointment));
    }

    $this->actingAs($patient)->get(route('notifications.index'))->assertInertia(fn (Assert $page) => $page
        ->component('notifications/index')
        ->has('notifications.data', 15)
        ->where('notificationCenter.unreadCount', 16)
        ->has('notificationCenter.latest', 7));
});

test('clicking a notification marks it read and redirects to its authorized destination', function () {
    $patient = notificationPatient();
    $appointment = notificationAppointment($patient, notificationDoctor());
    $patient->notify(new AppointmentSubmitted($appointment));
    $notification = $patient->unreadNotifications()->first();

    $this->actingAs($patient)->post(route('notifications.visit', $notification->id))
        ->assertRedirect(route('appointments.index', absolute: false));
    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('admin appointment request notifications open the approval queue instead of medical records', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = notificationPatient();
    $appointment = notificationAppointment($patient, notificationDoctor());
    $admin->notify(new \App\Notifications\NewAppointmentRequest($appointment));
    $notification = $admin->unreadNotifications()->first();

    $this->actingAs($admin)->post(route('notifications.visit', $notification->id))
        ->assertRedirect(route('admin.appointments.index', ['status' => 'pending', 'type' => 'individual'], false));
});
