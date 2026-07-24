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
