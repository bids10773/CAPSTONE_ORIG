<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Features;

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users can choose to stay signed in on a trusted device', function () {
    $user = User::factory()->create();

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'remember' => true,
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertCookie(Auth::guard('web')->getRecallerName());
});

test('ordinary sign in does not create a persistent login cookie', function () {
    $user = User::factory()->create();

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertCookieMissing(Auth::guard('web')->getRecallerName());
});

test('an unverified staff account is directed to email verification', function () {
    $doctor = User::factory()->unverified()->create([
        'role' => 'doctor',
    ]);

    $response = $this->post(route('login.store'), [
        'email' => $doctor->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($doctor);
    $response->assertRedirect(route('verification.notice'));
    expect($doctor->refresh()->hasVerifiedEmail())->toBeFalse();
});

test('an unverified staff account cannot bypass verification with a dashboard URL', function () {
    $doctor = User::factory()->unverified()->create(['role' => 'doctor']);

    $this->actingAs($doctor)
        ->get('/doctor/dashboard')
        ->assertRedirect(route('verification.notice'));
});

test('unverified patients are still directed to email verification', function () {
    $patient = User::factory()->unverified()->create([
        'role' => 'patient',
    ]);

    $response = $this->post(route('login.store'), [
        'email' => $patient->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($patient);
    $response->assertRedirect(route('verification.notice'));
});

test('users with two factor enabled are redirected to two factor challenge', function () {
    if (! Features::canManageTwoFactorAuthentication()) {
        $this->markTestSkipped('Two-factor authentication is not enabled.');
    }

    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]);

    $user = User::factory()->create();

    $user->forceFill([
        'two_factor_secret' => encrypt('test-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $response = $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('two-factor.login'));
    $response->assertSessionHas('login.id', $user->id);
    $this->assertGuest();
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors([
        'email' => 'The email or password you entered is incorrect.',
    ]);
});

test('a nonexistent email receives the same generic authentication error', function () {
    $response = $this->post(route('login.store'), [
        'email' => 'missing@example.com',
        'password' => 'password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors([
        'email' => 'The email or password you entered is incorrect.',
    ]);
});

test('login validates required and correctly formatted fields', function (array $input, array $errors) {
    $response = $this->post(route('login.store'), $input);

    $this->assertGuest();
    $response->assertSessionHasErrors($errors);
})->with([
    'empty fields' => [
        ['email' => '', 'password' => ''],
        ['email' => 'Email address is required.', 'password' => 'Password is required.'],
    ],
    'invalid email' => [
        ['email' => 'example@', 'password' => 'password'],
        ['email' => 'Please enter a valid email address.'],
    ],
]);

test('email whitespace and case are normalized without changing the password', function () {
    $user = User::factory()->create(['email' => 'person@example.com']);

    $response = $this->post(route('login.store'), [
        'email' => '  PERSON@EXAMPLE.COM  ',
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect('/dashboard');
});

test('inactive accounts are rejected before a session is authenticated', function () {
    $user = User::factory()->create(['is_active' => false]);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors([
        'email' => 'Your account is currently unavailable. Please contact the administrator.',
    ]);
});

test('a stored cross-role intended URL cannot override the role dashboard redirect', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);

    $response = $this->withSession(['url.intended' => '/admin/dashboard'])
        ->post(route('login.store'), [
            'email' => $doctor->email,
            'password' => 'password',
        ]);

    $this->assertAuthenticatedAs($doctor);
    $response->assertRedirect('/doctor/dashboard');
});

test('backend role middleware rejects access to another roles dashboard', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);

    $this->actingAs($doctor)
        ->get('/admin/dashboard')
        ->assertForbidden();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $this->assertGuest();
    $response->assertRedirect(route('login'));
});

test('users are rate limited', function () {
    $user = User::factory()->create();

    foreach ([4, 3, 2, 1] as $remaining) {
        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors([
            'email' => 'The email or password you entered is incorrect.',
        ]);
        $response->assertSessionHas('login_attempt_limit', fn (array $state) => $state['remainingAttempts'] === $remaining && $state['locked'] === false);
    }

    $fifthAttempt = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
    $fifthAttempt->assertSessionHasErrors([
        'email' => 'The email or password you entered is incorrect.',
    ]);
    $fifthAttempt->assertSessionHas('login_attempt_limit', fn (array $state) => $state['remainingAttempts'] === 0
        && $state['locked'] === true
        && $state['retryAfter'] > 0
        && $state['retryAfter'] <= 60);

    $blockedAttempt = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertGuest();
    $blockedAttempt->assertSessionHasErrors([
        'email' => 'Too many failed login attempts.',
    ]);

    $this->travel(61)->seconds();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($user);
});

test('validation failures do not consume login attempts', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), ['email' => '', 'password' => ''])
        ->assertSessionMissing('login_attempt_limit');

    $this->post(route('login.store'), [
        'email' => 'not-an-email',
        'password' => 'password',
    ])->assertSessionMissing('login_attempt_limit');

    $failedCredentials = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $failedCredentials->assertSessionHas('login_attempt_limit', fn (array $state) => $state['remainingAttempts'] === 4);
});

test('successful login clears previous failed attempts', function () {
    $user = User::factory()->create();

    foreach (range(1, 2) as $_) {
        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);
    }

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);
    $this->assertAuthenticatedAs($user);

    $this->post(route('logout'));

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertSessionHas('login_attempt_limit', fn (array $state) => $state['remainingAttempts'] === 4);
});
