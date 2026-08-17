<?php

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'first_name' => 'Test',
        'middle_name' => null,
        'last_name' => 'User',
        'email' => 'test@example.com',
        'contact' => '09123456789',
        'birthdate' => '1990-01-01',
        'sex' => 'Male',
        'civil_status' => 'Single',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect();
});

test('registration normalizes Philippine mobile numbers', function () {
    $this->post(route('register.store'), [
        'first_name' => 'Normalized', 'last_name' => 'Patient',
        'email' => 'normalized@example.com', 'contact' => '+63 917 123 4567',
        'birthdate' => '1990-01-01', 'sex' => 'Male', 'civil_status' => 'Single',
        'password' => 'password', 'password_confirmation' => 'password',
    ])->assertSessionDoesntHaveErrors();

    $this->assertDatabaseHas('users', ['email' => 'normalized@example.com', 'contact' => '639171234567']);
});

test('strong duplicate registration signal is blocked without exposing account details', function () {
    $existing = \App\Models\User::factory()->create(['role' => 'patient', 'contact' => '09171234567']);
    $existing->patientProfile()->create(['birthdate' => '1990-01-01', 'sex' => 'Male', 'civil_status' => 'Single']);

    $this->post(route('register.store'), [
        'first_name' => 'Another', 'last_name' => 'Person',
        'email' => 'another@example.com', 'contact' => '+639171234567',
        'birthdate' => '1990-01-01', 'sex' => 'Male', 'civil_status' => 'Single',
        'password' => 'password', 'password_confirmation' => 'password',
    ])->assertSessionHasErrors('account');

    $this->assertDatabaseMissing('users', ['email' => 'another@example.com']);
    $this->assertDatabaseHas('security_audits', ['action' => 'possible_duplicate_account', 'status' => 'review']);
});

test('registration accepts a valid leap-day birthdate', function () {
    $this->post(route('register.store'), [
        'first_name' => 'Leap', 'last_name' => 'Patient',
        'email' => 'leap@example.com', 'contact' => '09171230001',
        'birthdate' => '2024-02-29', 'sex' => 'Female', 'civil_status' => 'Single',
        'password' => 'password', 'password_confirmation' => 'password',
    ])->assertSessionDoesntHaveErrors('birthdate');

    expect(\App\Models\PatientProfile::query()->firstOrFail()->birthdate->toDateString())->toBe('2024-02-29');
});

test('registration rejects invalid calendar birthdates', function (string $birthdate) {
    $this->post(route('register.store'), [
        'first_name' => 'Invalid', 'last_name' => 'Patient',
        'email' => 'invalid-'.md5($birthdate).'@example.com', 'contact' => '09171230002',
        'birthdate' => $birthdate, 'sex' => 'Male', 'civil_status' => 'Single',
        'password' => 'password', 'password_confirmation' => 'password',
    ])->assertSessionHasErrors(['birthdate' => 'Please enter a valid birthdate.']);
})->with(['2025-02-29', '2003-02-31', '2003-13-18', '18-08-2003']);

test('registration rejects a future birthdate', function () {
    $future = today()->addDay()->toDateString();
    $this->post(route('register.store'), [
        'first_name' => 'Future', 'last_name' => 'Patient',
        'email' => 'future@example.com', 'contact' => '09171230003',
        'birthdate' => $future, 'sex' => 'Male', 'civil_status' => 'Single',
        'password' => 'password', 'password_confirmation' => 'password',
    ])->assertSessionHasErrors(['birthdate' => 'Birthdate cannot be in the future.']);
});
