<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('local command creates an administrator with expiring temporary credentials', function () {
    $this->artisan('app:create-admin', ['email' => 'owner@example.test'])
        ->assertSuccessful();

    $admin = User::query()->where('email', 'owner@example.test')->firstOrFail();

    expect($admin->role)->toBe('admin')
        ->and($admin->is_active)->toBeTrue()
        ->and($admin->hasVerifiedEmail())->toBeTrue()
        ->and($admin->must_change_password)->toBeTrue()
        ->and($admin->temporary_password_expires_at)->not->toBeNull()
        ->and($admin->temporary_password_expires_at->isFuture())->toBeTrue()
        ->and(Hash::needsRehash($admin->password))->toBeFalse();
});

test('local command never overwrites an existing administrator', function () {
    $admin = User::factory()->create([
        'email' => 'existing-admin@example.test',
        'role' => 'admin',
        'first_name' => 'Existing',
    ]);
    $originalPassword = $admin->password;

    $this->artisan('app:create-admin', ['email' => $admin->email])
        ->expectsOutput('An administrator with that email already exists. No changes were made.')
        ->assertSuccessful();

    expect($admin->fresh()->first_name)->toBe('Existing')
        ->and($admin->fresh()->password)->toBe($originalPassword);
});

test('local command refuses to convert an existing non-administrator', function () {
    $patient = User::factory()->create([
        'email' => 'patient@example.test',
        'role' => 'patient',
    ]);

    $this->artisan('app:create-admin', ['email' => $patient->email])
        ->expectsOutput('That email already belongs to a non-administrator account.')
        ->assertFailed();

    expect($patient->fresh()->role)->toBe('patient');
});
