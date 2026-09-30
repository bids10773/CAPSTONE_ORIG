<?php

use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('production bootstrap creates only the first administrator and sends a setup link', function () {
    Notification::fake();
    $this->app->detectEnvironment(fn (): string => 'production');

    $this->artisan('app:bootstrap-admin', [
        'email' => 'owner@example.test',
        '--first-name' => 'Clinic',
        '--last-name' => 'Owner',
    ])->expectsConfirmation('Create the first production administrator for owner@example.test?', 'yes')
        ->assertSuccessful();

    $admin = User::query()->where('email', 'owner@example.test')->firstOrFail();

    expect($admin->role)->toBe('admin')
        ->and($admin->first_name)->toBe('Clinic')
        ->and($admin->last_name)->toBe('Owner')
        ->and($admin->is_active)->toBeTrue()
        ->and($admin->hasVerifiedEmail())->toBeFalse()
        ->and($admin->must_change_password)->toBeFalse()
        ->and($admin->temporary_password_created_at)->toBeNull()
        ->and($admin->temporary_password_expires_at)->toBeNull()
        ->and(Hash::needsRehash($admin->password))->toBeFalse();

    Notification::assertSentTo(
        $admin,
        ResetPassword::class,
        fn (ResetPassword $notification): bool => filled($notification->token),
    );

    $audit = SecurityAudit::query()->where('action', 'initial_admin_bootstrapped')->firstOrFail();

    expect($audit->target_user_id)->toBe($admin->id)
        ->and($audit->status)->toBe('pending_setup')
        ->and($audit->metadata['source'])->toBe('artisan');
});

test('production bootstrap refuses to create a second administrator', function () {
    Notification::fake();
    User::factory()->create(['role' => 'admin']);

    $this->artisan('app:bootstrap-admin', ['email' => 'second-owner@example.test'])
        ->expectsOutput('An administrator already exists. Use the authenticated account-management or password-reset workflow instead.')
        ->assertFailed();

    expect(User::query()->where('role', 'admin')->count())->toBe(1)
        ->and(SecurityAudit::query()->where('action', 'initial_admin_bootstrapped')->exists())->toBeFalse();
    Notification::assertNothingSent();
});

test('production bootstrap refuses an email belonging to another account', function () {
    Notification::fake();
    User::factory()->create([
        'email' => 'patient@example.test',
        'role' => 'patient',
    ]);

    $this->artisan('app:bootstrap-admin', ['email' => 'patient@example.test'])
        ->expectsOutput('That email already belongs to an existing account.')
        ->assertFailed();

    expect(User::query()->where('role', 'admin')->exists())->toBeFalse();
    Notification::assertNothingSent();
});

test('production bootstrap rolls back when the setup email cannot be sent', function () {
    Notification::shouldReceive('send')->andThrow(new RuntimeException('Mail unavailable'));

    $this->artisan('app:bootstrap-admin', ['email' => 'owner@example.test'])
        ->expectsOutput('The administrator could not be created or the setup email could not be delivered. No account was saved.')
        ->assertFailed();

    expect(User::query()->where('email', 'owner@example.test')->exists())->toBeFalse()
        ->and(SecurityAudit::query()->where('action', 'initial_admin_bootstrapped')->exists())->toBeFalse();
});

test('production bootstrap requires explicit confirmation in production', function () {
    Notification::fake();
    $this->app->detectEnvironment(fn (): string => 'production');

    $this->artisan('app:bootstrap-admin', ['email' => 'owner@example.test'])
        ->expectsConfirmation('Create the first production administrator for owner@example.test?', 'no')
        ->expectsOutput('Administrator bootstrap cancelled.')
        ->assertFailed();

    expect(User::query()->where('role', 'admin')->exists())->toBeFalse();
    Notification::assertNothingSent();
});
