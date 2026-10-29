<?php

use App\Events\NotificationCenterUpdated;
use App\Models\Appointment;
use App\Models\User;
use App\Notifications\AppointmentSubmitted;
use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
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

test('appointment submission stores role-aware reviewer and patient notifications', function () {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $receptionist = User::factory()->create(['role' => 'receptionist', 'is_active' => true]);
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
        ->and($receptionist->unreadNotifications()->count())->toBe(1)
        ->and($receptionist->unreadNotifications()->first()->data['type'])->toBe('appointment_request');
});

test('database notifications dispatch a private notification center update', function () {
    Event::fake([NotificationCenterUpdated::class]);
    $patient = notificationPatient();

    $patient->notify(new AppointmentSubmitted(
        notificationAppointment($patient, notificationDoctor()),
    ));

    Event::assertDispatched(
        NotificationCenterUpdated::class,
        fn (NotificationCenterUpdated $event) => $event->userId === $patient->id
            && $event->unreadCount === 1
            && $event->broadcastOn()[0]->name === 'private-App.Models.User.'.$patient->id,
    );
});

test('notification center updates wait for database transactions to commit', function () {
    expect(new NotificationCenterUpdated(1, 1))
        ->toBeInstanceOf(ShouldDispatchAfterCommit::class);
});

test('users can authorize only their own private notification channel', function () {
    config()->set('broadcasting.default', 'reverb');
    app(BroadcastManager::class)->purge();
    require base_path('routes/channels.php');
    $patient = notificationPatient();
    $other = notificationPatient();
    $payload = ['socket_id' => '1234.5678'];

    $this->actingAs($patient)->postJson('/broadcasting/auth', [
        ...$payload,
        'channel_name' => 'private-App.Models.User.'.$patient->id,
    ])->assertOk();

    $this->postJson('/broadcasting/auth', [
        ...$payload,
        'channel_name' => 'private-App.Models.User.'.$other->id,
    ])->assertForbidden();
});

test('approval creates exactly one patient confirmation and one doctor assignment', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = notificationPatient();
    $doctor = notificationDoctor();
    $appointment = notificationAppointment($patient, $doctor);

    $this->actingAs($admin)->patch(route('admin.appointments.approve', $appointment), [
        'override_reason' => 'Manual exception review.',
    ])->assertSessionHasNoErrors();

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

test('authenticated user can remove one or all of only their own notifications', function () {
    $patient = notificationPatient();
    $other = notificationPatient();
    $doctor = notificationDoctor();
    $patient->notify(new AppointmentSubmitted(notificationAppointment($patient, $doctor)));
    $patient->notify(new AppointmentSubmitted(notificationAppointment($patient, $doctor)));
    $other->notify(new AppointmentSubmitted(notificationAppointment($other, $doctor)));
    $first = $patient->notifications()->first();

    $this->actingAs($patient)->delete(route('notifications.destroy', $first->id))->assertRedirect();
    expect($patient->notifications()->count())->toBe(1);

    $this->delete(route('notifications.destroy', $other->notifications()->first()->id))->assertNotFound();
    expect($other->notifications()->count())->toBe(1);

    $this->delete(route('notifications.destroy-all'))->assertRedirect();
    expect($patient->notifications()->count())->toBe(0)
        ->and($other->notifications()->count())->toBe(1);
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

test('authenticated user can refresh notification center data without reloading the page', function () {
    $patient = notificationPatient();
    $appointment = notificationAppointment($patient, notificationDoctor());
    $patient->notify(new AppointmentSubmitted($appointment));

    $this->actingAs($patient)->getJson(route('notifications.center'))
        ->assertOk()
        ->assertJsonPath('unreadCount', 1)
        ->assertJsonCount(1, 'latest')
        ->assertJsonPath('latest.0.type', 'appointment_submitted');
});

test('clicking a notification marks it read and redirects to its authorized destination', function () {
    $patient = notificationPatient();
    $appointment = notificationAppointment($patient, notificationDoctor());
    $patient->notify(new AppointmentSubmitted($appointment));
    $notification = $patient->unreadNotifications()->first();

    $this->actingAs($patient)->post(route('notifications.visit', $notification->id))
        ->assertRedirect(route('appointments.show', $appointment, false));
    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('clicking a cancellation notification opens the cancelled appointment record', function () {
    $patient = notificationPatient();
    $appointment = notificationAppointment($patient, notificationDoctor());
    $patient->notify(new \App\Notifications\AppointmentCancelled($appointment));
    $notification = $patient->unreadNotifications()->first();

    $this->actingAs($patient)->post(route('notifications.visit', $notification->id))
        ->assertRedirect(route('appointments.show', $appointment, false));

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

test('receptionist appointment request notifications open the receptionist review queue', function () {
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $patient = notificationPatient();
    $appointment = notificationAppointment($patient, notificationDoctor());
    $receptionist->notify(new \App\Notifications\NewAppointmentRequest($appointment));
    $notification = $receptionist->unreadNotifications()->first();

    $this->actingAs($receptionist)->post(route('notifications.visit', $notification->id))
        ->assertRedirect(route('receptionist.appointment-requests.index', ['status' => 'pending'], false));
});

test('admin cancellation notifies the patient exactly once', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = notificationPatient();
    $appointment = notificationAppointment($patient, notificationDoctor());

    $this->actingAs($admin)->patch(route('admin.appointments.update-status', $appointment), [
        'status' => 'cancelled',
    ])->assertSessionHasNoErrors();

    expect($patient->notifications()->where('data->type', 'appointment_cancelled')->count())->toBe(1);

    $this->patch(route('admin.appointments.update-status', $appointment), [
        'status' => 'cancelled',
    ])->assertSessionHasNoErrors();

    expect($patient->notifications()->where('data->type', 'appointment_cancelled')->count())->toBe(1);
});

test('notification visits reject external and malformed stored destinations', function (string $url) {
    $patient = notificationPatient();
    $notification = $patient->notifications()->create([
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'type' => 'legacy',
        'data' => ['type' => 'legacy', 'url' => $url],
    ]);

    $this->actingAs($patient)->post(route('notifications.visit', $notification->id))
        ->assertRedirect(route('notifications.index', absolute: false));
    expect($notification->fresh()->read_at)->not->toBeNull();
})->with(['//example.com/phishing', '/\\example.com/phishing', 'https://example.com', '/admin/inquiries/1']);

test('notification visits fall back when appointment ownership or assignment has changed', function (string $role) {
    $patient = notificationPatient();
    $doctor = notificationDoctor();
    $appointment = notificationAppointment($patient, $doctor);
    $recipient = $role === 'doctor' ? notificationDoctor() : notificationPatient();
    $notification = $recipient->notifications()->create([
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'type' => 'legacy',
        'data' => ['type' => $role === 'doctor' ? 'appointment_assigned' : 'appointment_confirmed', 'appointment_id' => $appointment->id],
    ]);

    $this->actingAs($recipient)->post(route('notifications.visit', $notification->id))
        ->assertRedirect(route('notifications.index', absolute: false));
})->with(['patient', 'doctor']);

test('notification center refresh contains only the signed in users records', function () {
    $patient = notificationPatient();
    $other = notificationPatient();
    $other->notify(new AppointmentSubmitted(notificationAppointment($other, notificationDoctor())));

    $this->actingAs($patient)->getJson(route('notifications.center'))
        ->assertOk()->assertJsonPath('unreadCount', 0)->assertJsonCount(0, 'latest');
    $this->post(route('notifications.visit', $other->notifications()->first()->id))->assertNotFound();
});

test('old role notifications are hidden from shared props and every notification action', function () {
    $patient = notificationPatient();
    foreach ([['recipient_role' => 'admin', 'type' => 'system_update'], ['type' => 'appointment_request']] as $data) {
        $notification = $patient->notifications()->create([
            'id' => (string) \Illuminate\Support\Str::uuid(), 'type' => 'legacy', 'data' => $data,
        ]);
        $this->actingAs($patient)->post(route('notifications.visit', $notification->id))->assertNotFound();
        $this->patch(route('notifications.read', $notification->id))->assertNotFound();
        $this->delete(route('notifications.destroy', $notification->id))->assertNotFound();
    }
    $this->getJson(route('notifications.center'))->assertJsonCount(0, 'latest')->assertJsonPath('unreadCount', 0);
    $this->get(route('notifications.index'))->assertInertia(fn (Assert $page) => $page
        ->has('notifications.data', 0)->has('notificationCenter.latest', 0)->where('notificationCenter.unreadCount', 0));
    $this->patch(route('notifications.read-all'))->assertRedirect();
    expect($patient->unreadNotifications()->count())->toBe(2);
    $this->delete(route('notifications.destroy-all'))->assertRedirect();
    expect($patient->notifications()->count())->toBe(2);
});

test('notification broadcast transport errors do not interrupt database delivery', function () {
    $patient = notificationPatient();
    \Illuminate\Support\Facades\Event::partialMock()->shouldReceive('dispatch')
        ->with(\Mockery::type(NotificationCenterUpdated::class))->andThrow(new \RuntimeException('Reverb unavailable'));
    $listener = new \App\Listeners\BroadcastNotificationCenterUpdate;
    $listener->handle(new \Illuminate\Notifications\Events\NotificationSent(
        $patient, new AppointmentSubmitted(notificationAppointment($patient, notificationDoctor())), 'database', null,
    ));
    expect(true)->toBeTrue();
});

test('after commit notification broadcasts tolerate an unavailable transport', function () {
    $manager = app(BroadcastManager::class);
    $manager->extend('unavailable', fn () => new class extends \Illuminate\Broadcasting\Broadcasters\NullBroadcaster
    {
        public function broadcast(array $channels, $event, array $payload = [])
        {
            throw new \RuntimeException('Transport unavailable after commit');
        }
    });
    config()->set('broadcasting.default', 'unavailable');
    config()->set('broadcasting.connections.unavailable', ['driver' => 'unavailable']);

    $manager->queue(new NotificationCenterUpdated(1, 0));
    expect(true)->toBeTrue();
});

test('company notification visibility follows the recipients current company affiliation', function () {
    $companies = collect(['Former company', 'Current company'])->map(fn ($name) => \App\Models\Company::create([
        'company_name' => $name, 'status' => 'active',
    ]));
    $user = User::factory()->create(['role' => 'company', 'company_id' => $companies[1]->id]);
    foreach ($companies as $company) {
        $user->notifications()->create([
            'id' => (string) \Illuminate\Support\Str::uuid(), 'type' => 'workflow',
            'data' => ['type' => 'system_update', 'recipient_role' => 'company', 'recipient_company_id' => $company->id],
        ]);
    }
    $this->actingAs($user)->getJson(route('notifications.center'))
        ->assertJsonCount(1, 'latest')->assertJsonPath('latest.0.recipient_company_id', $companies[1]->id);
    $this->patch(route('notifications.read-all'))->assertRedirect();
    expect($user->unreadNotifications()->count())->toBe(1);
    $this->delete(route('notifications.destroy-all'))->assertRedirect();
    expect($user->notifications()->count())->toBe(1);
});
