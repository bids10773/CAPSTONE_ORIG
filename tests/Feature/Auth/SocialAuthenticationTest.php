<?php

use App\Models\PatientProfile;
use App\Models\SocialAccount;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

function fakeSocialIdentity(string $provider, array $attributes): void
{
    $identity = (new SocialiteUser)->map($attributes)->setRaw($attributes);
    $driver = Mockery::mock();
    $driver->shouldReceive('user')->once()->andReturn($identity);
    Socialite::shouldReceive('driver')->with($provider)->once()->andReturn($driver);
}

test('new verified Google identity creates only a patient and requires profile completion', function () {
    fakeSocialIdentity('google', [
        'id' => 'google-123',
        'name' => 'Juan Dela Cruz',
        'email' => 'juan@example.com',
        'email_verified' => true,
    ]);

    $this->get('/auth/google/callback')->assertRedirect(route('patient-profile.complete'));

    $user = User::where('email', 'juan@example.com')->firstOrFail();
    expect($user->role)->toBe('patient')
        ->and($user->password)->toBeNull()
        ->and($user->email_verified_at)->not->toBeNull();
    $this->assertDatabaseHas('social_accounts', [
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_user_id' => 'google-123',
    ]);
});

test('verified Google email links an existing staff account without changing its role', function () {
    $doctor = User::factory()->create([
        'email' => 'doctor@example.com',
        'role' => 'doctor',
        'is_active' => true,
        'email_verified_at' => now(),
    ]);
    fakeSocialIdentity('google', [
        'id' => 'google-doctor',
        'name' => 'Doctor User',
        'email' => 'doctor@example.com',
        'email_verified' => true,
    ]);

    $this->get('/auth/google/callback')->assertRedirect('/doctor/dashboard');

    expect($doctor->fresh()->role)->toBe('doctor');
    $this->assertDatabaseCount('users', 1);
});

test('social sign in requires enrolled MFA before authenticating', function (string $provider, bool $linked) {
    $doctor = User::factory()->withTwoFactor()->create(['role' => 'doctor']);
    if ($linked) {
        SocialAccount::create(['user_id' => $doctor->id, 'provider' => $provider, 'provider_user_id' => 'mfa-identity']);
    }
    fakeSocialIdentity($provider, ['id' => 'mfa-identity', 'email' => $doctor->email, 'email_verified' => true]);

    $this->get(route('social.callback', $provider))
        ->assertRedirect(route('two-factor.login'))
        ->assertSessionHas('login.id', $doctor->id)
        ->assertSessionHas('login.remember', true);

    $this->assertGuest();
    expect($doctor->fresh()->remember_token)->toBe($doctor->remember_token);
    $this->get('/doctor/dashboard')->assertRedirect(route('login'));
    $this->get(route('two-factor.login'))->assertOk();
})->with([
    'Google email match' => ['google', false],
    'linked Google' => ['google', true],
    'linked Facebook' => ['facebook', true],
]);

test('social MFA accepts a recovery code only after rejecting an invalid challenge', function () {
    $doctor = User::factory()->withTwoFactor()->create(['role' => 'doctor']);
    fakeSocialIdentity('google', ['id' => 'mfa-recovery', 'email' => $doctor->email, 'email_verified' => true]);

    $this->get(route('social.callback', 'google'))->assertRedirect(route('two-factor.login'));
    $this->post('/two-factor-challenge', ['recovery_code' => 'invalid-code'])
        ->assertSessionHasErrors();
    $this->assertGuest();

    $this->post('/two-factor-challenge', ['recovery_code' => 'recovery-code-1'])
        ->assertRedirect()
        ->assertSessionMissing('login.id');

    $this->assertAuthenticatedAs($doctor);
    expect($doctor->fresh()->recoveryCodes())->not->toContain('recovery-code-1');
    $this->get('/doctor/dashboard')->assertOk();
});

test('social sign in keeps unconfirmed MFA enrollment from blocking login', function () {
    $doctor = User::factory()->withTwoFactor()->create(['role' => 'doctor', 'two_factor_confirmed_at' => null]);
    fakeSocialIdentity('google', ['id' => 'unconfirmed-mfa', 'email' => $doctor->email, 'email_verified' => true]);

    $this->get(route('social.callback', 'google'))->assertRedirect('/doctor/dashboard');

    $this->assertAuthenticatedAs($doctor);
});

test('an inactive linked social account cannot authenticate', function () {
    $user = User::factory()->create(['is_active' => false, 'email_verified_at' => now()]);
    SocialAccount::create(['user_id' => $user->id, 'provider' => 'google', 'provider_user_id' => 'blocked-google']);
    fakeSocialIdentity('google', ['id' => 'blocked-google', 'email' => $user->email, 'email_verified' => true]);

    $this->get('/auth/google/callback')
        ->assertRedirect(route('login'))
        ->assertSessionHas('error');
    $this->assertGuest();
});

test('a valid social identity cannot bypass an account lock', function () {
    $user = User::factory()->create([
        'role' => 'doctor',
        'login_locked_at' => now(),
        'failed_login_attempts' => 5,
        'email_verified_at' => now(),
    ]);
    SocialAccount::create(['user_id' => $user->id, 'provider' => 'google', 'provider_user_id' => 'locked-google']);
    fakeSocialIdentity('google', ['id' => 'locked-google', 'email' => $user->email, 'email_verified' => true]);

    $this->get(route('social.callback', 'google'))
        ->assertRedirect(route('login'))->assertSessionHas('error', \App\Security\LoginRateLimiter::ACCOUNT_LOCK_MESSAGE);

    $this->assertGuest();
    expect($user->refresh()->login_locked_at)->not->toBeNull();
});

test('Facebook without email pauses registration for verified email collection', function () {
    fakeSocialIdentity('facebook', ['id' => 'facebook-no-email', 'name' => 'Facebook Patient', 'email' => null]);

    $this->get('/auth/facebook/callback')
        ->assertRedirect(route('social.email.create'))
        ->assertSessionHas('social_registration');
    $this->assertDatabaseCount('users', 0);
});

test('Facebook does not automatically link an existing email without a trusted signal', function () {
    User::factory()->create(['email' => 'existing@example.com']);
    fakeSocialIdentity('facebook', ['id' => 'facebook-existing', 'name' => 'Existing User', 'email' => 'existing@example.com']);

    $this->get('/auth/facebook/callback')
        ->assertRedirect(route('login'))
        ->assertSessionHas('error');
    $this->assertDatabaseMissing('social_accounts', ['provider_user_id' => 'facebook-existing']);
});

test('incomplete social patients are blocked from booking until profile completion', function () {
    $patient = User::factory()->create(['role' => 'patient', 'is_active' => true, 'email_verified_at' => now()]);
    PatientProfile::create(['user_id' => $patient->id]);
    SocialAccount::create(['user_id' => $patient->id, 'provider' => 'google', 'provider_user_id' => 'incomplete']);

    $this->actingAs($patient)->get('/appointments/create')
        ->assertRedirect(route('patient-profile.complete'));
});

test('social patient can complete required clinic profile fields', function () {
    $patient = User::factory()->create(['role' => 'patient', 'is_active' => true, 'email_verified_at' => now()]);
    PatientProfile::create(['user_id' => $patient->id]);
    SocialAccount::create(['user_id' => $patient->id, 'provider' => 'google', 'provider_user_id' => 'complete-me']);

    $this->actingAs($patient)->put('/complete-patient-profile', [
        'first_name' => 'Juan',
        'middle_name' => null,
        'last_name' => 'Dela Cruz',
        'birthdate' => now()->subYears(25)->format('Y-m-d'),
        'sex' => 'Male',
        'civil_status' => 'Single',
        'contact' => '09171234567',
        'address' => '123 Clinic Street, Manila',
    ])->assertRedirect(route('dashboard'));

    expect($patient->fresh()->hasCompletePatientProfile())->toBeTrue();
});
