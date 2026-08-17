<?php

use App\Models\User;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'first_name' => 'Test',
            'middle_name' => null,
            'last_name' => 'User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'first_name' => 'Test',
            'middle_name' => null,
            'last_name' => 'User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('patient can update account and personal profile fields through the existing endpoint', function () {
    $user = User::factory()->create(['role' => 'patient', 'contact' => '09170000000']);
    $user->patientProfile()->create([
        'birthdate' => '1990-01-01',
        'sex' => 'Male',
        'civil_status' => 'Single',
    ]);

    $this->actingAs($user)->patch(route('profile.update'), [
        'first_name' => $user->first_name,
        'middle_name' => $user->middle_name,
        'last_name' => $user->last_name,
        'email' => $user->email,
        'contact' => '+63 917 123 4567',
        'birthdate' => '2003-08-18',
        'sex' => 'Female',
        'civil_status' => 'Widowed',
        'role' => 'admin',
        'is_active' => false,
    ])->assertSessionDoesntHaveErrors()->assertRedirect(route('profile.edit'));

    expect($user->refresh())
        ->contact->toBe('639171234567')
        ->role->toBe('patient')
        ->is_active->toBeTrue()
        ->and($user->patientProfile->birthdate->toDateString())->toBe('2003-08-18')
        ->and($user->patientProfile->sex)->toBe('Female')
        ->and($user->patientProfile->civil_status)->toBe('Widowed');
});

test('profile update rejects invalid patient personal details', function () {
    $user = User::factory()->create(['role' => 'patient']);

    $this->actingAs($user)->patch(route('profile.update'), [
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => $user->email,
        'contact' => 'not-a-phone',
        'birthdate' => today()->addDay()->toDateString(),
        'sex' => 'Unknown',
        'civil_status' => 'Unsupported',
    ])->assertSessionHasErrors(['contact', 'birthdate', 'sex', 'civil_status']);
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});
