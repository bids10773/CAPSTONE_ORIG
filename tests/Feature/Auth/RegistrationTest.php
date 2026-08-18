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
        'password' => 'Hello123',
        'password_confirmation' => 'Hello123',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect();
});

test('registration enforces the shared password policy', function (string $password, string $message) {
    $this->post(route('register.store'), [
        'first_name' => 'Policy',
        'last_name' => 'Test',
        'email' => 'policy-'.md5($password).'@example.com',
        'contact' => '09171234567',
        'birthdate' => '1990-01-01',
        'sex' => 'Male',
        'civil_status' => 'Single',
        'password' => $password,
        'password_confirmation' => $password,
    ])->assertSessionHasErrors(['password' => $message]);
})->with([
    'only two categories' => ['hello123', 'Password must contain at least 3 of the following: an uppercase letter, a lowercase letter, a number, and a symbol.'],
    'too short' => ['Ab1!', 'Password must be at least 8 characters long.'],
    'letters only' => ['abcdefgh', 'Password must contain at least 3 of the following: an uppercase letter, a lowercase letter, a number, and a symbol.'],
]);

test('registration rejects a mismatched password confirmation', function () {
    $this->post(route('register.store'), [
        'first_name' => 'Mismatch',
        'last_name' => 'Test',
        'email' => 'mismatch@example.com',
        'contact' => '09171234567',
        'birthdate' => '1990-01-01',
        'sex' => 'Male',
        'civil_status' => 'Single',
        'password' => 'Hello123',
        'password_confirmation' => 'Hello124',
    ])->assertSessionHasErrors(['password' => 'Passwords do not match.']);
});

test('registration normalizes Philippine mobile numbers', function () {
    $this->post(route('register.store'), [
        'first_name' => 'Normalized', 'last_name' => 'Patient',
        'email' => 'normalized@example.com', 'contact' => '+63 917 123 4567',
        'birthdate' => '1990-01-01', 'sex' => 'Male', 'civil_status' => 'Single',
        'password' => 'Hello123', 'password_confirmation' => 'Hello123',
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
        'password' => 'Hello123', 'password_confirmation' => 'Hello123',
    ])->assertSessionHasErrors('account');

    $this->assertDatabaseMissing('users', ['email' => 'another@example.com']);
    $this->assertDatabaseHas('security_audits', ['action' => 'possible_duplicate_account', 'status' => 'review']);
});

test('registration accepts a valid leap-day birthdate', function () {
    $this->post(route('register.store'), [
        'first_name' => 'Leap', 'last_name' => 'Patient',
        'email' => 'leap@example.com', 'contact' => '09171230001',
        'birthdate' => '2004-02-29', 'sex' => 'Female', 'civil_status' => 'Single',
        'password' => 'Hello123', 'password_confirmation' => 'Hello123',
    ])->assertSessionDoesntHaveErrors('birthdate');

    expect(\App\Models\PatientProfile::query()->firstOrFail()->birthdate->toDateString())->toBe('2004-02-29');
});

test('registration rejects invalid calendar birthdates', function (string $birthdate) {
    $this->post(route('register.store'), [
        'first_name' => 'Invalid', 'last_name' => 'Patient',
        'email' => 'invalid-'.md5($birthdate).'@example.com', 'contact' => '09171230002',
        'birthdate' => $birthdate, 'sex' => 'Male', 'civil_status' => 'Single',
        'password' => 'Hello123', 'password_confirmation' => 'Hello123',
    ])->assertSessionHasErrors(['birthdate' => 'Please enter a valid birthdate.']);
})->with(['2025-02-29', '2003-02-31', '2003-13-18', '18-08-2003']);

test('registration rejects a future birthdate', function () {
    $future = today()->addDay()->toDateString();
    $this->post(route('register.store'), [
        'first_name' => 'Future', 'last_name' => 'Patient',
        'email' => 'future@example.com', 'contact' => '09171230003',
        'birthdate' => $future, 'sex' => 'Male', 'civil_status' => 'Single',
        'password' => 'Hello123', 'password_confirmation' => 'Hello123',
    ])->assertSessionHasErrors(['birthdate' => 'Birthdate cannot be in the future.']);
});

test('registration accepts a patient who is exactly 18 years old', function () {
    $this->post(route('register.store'), [
        'first_name' => 'Legal', 'last_name' => 'Adult',
        'email' => 'legal-adult@example.com', 'contact' => '09171230004',
        'birthdate' => today()->subYearsNoOverflow(18)->toDateString(),
        'sex' => 'Male', 'civil_status' => 'Single',
        'password' => 'Hello123', 'password_confirmation' => 'Hello123',
    ])->assertSessionDoesntHaveErrors('birthdate');

    $this->assertDatabaseHas('users', ['email' => 'legal-adult@example.com']);
});

test('registration rejects a patient who is one day under 18', function () {
    $this->post(route('register.store'), [
        'first_name' => 'Underage', 'last_name' => 'Patient',
        'email' => 'underage@example.com', 'contact' => '09171230005',
        'birthdate' => today()->subYearsNoOverflow(18)->addDay()->toDateString(),
        'sex' => 'Female', 'civil_status' => 'Single',
        'password' => 'Hello123', 'password_confirmation' => 'Hello123',
    ])->assertSessionHasErrors([
        'birthdate' => 'You must be at least 18 years old to create an account.',
    ]);

    $this->assertDatabaseMissing('users', ['email' => 'underage@example.com']);
});
