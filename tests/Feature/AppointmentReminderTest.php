<?php

use App\Models\Appointment;
use App\Models\User;
use App\Notifications\AppointmentReminder;
use App\Services\AppointmentReminderService;
use Illuminate\Support\Facades\Notification;

beforeEach(fn () => Notification::fake());

function reminderAppointment(User $patient, array $overrides = []): Appointment
{
    return Appointment::create(array_merge([
        'user_id' => $patient->id,
        'appointment_date' => today()->addDay(),
        'start_time' => '09:00',
        'end_time' => '09:30',
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['PE'],
    ], $overrides));
}

test('automatic reminders are sent once one day before an accepted patient appointment', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = reminderAppointment($patient);
    reminderAppointment(User::factory()->create(['role' => 'patient']), [
        'appointment_date' => today()->addDays(2),
    ]);
    reminderAppointment(User::factory()->create(['role' => 'patient']), [
        'status' => 'pending',
    ]);

    $service = app(AppointmentReminderService::class);

    expect($service->sendDue())->toBe(1)
        ->and($service->sendDue())->toBe(0)
        ->and($appointment->fresh()->reminder_sent_at)->not->toBeNull();

    Notification::assertSentToTimes($patient, AppointmentReminder::class, 1);
});

test('a receptionist can send and resend a reminder for an accepted upcoming appointment', function () {
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = reminderAppointment($patient);

    $this->actingAs($receptionist)
        ->post(route('receptionist.appointment-requests.remind', $appointment))
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->actingAs($receptionist)
        ->post(route('receptionist.appointment-requests.remind', $appointment))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($appointment->fresh()->reminder_sent_at)->not->toBeNull();
    Notification::assertSentToTimes($patient, AppointmentReminder::class, 2);
});

test('reminders cannot be sent for pending or past appointments', function (array $overrides) {
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $appointment = reminderAppointment(
        User::factory()->create(['role' => 'patient']),
        $overrides,
    );

    $this->actingAs($receptionist)
        ->post(route('receptionist.appointment-requests.remind', $appointment))
        ->assertSessionHasErrors('appointment');

    Notification::assertNothingSent();
})->with([
    'pending' => [['status' => 'pending']],
    'past' => [['appointment_date' => today()->subDay()]],
]);
