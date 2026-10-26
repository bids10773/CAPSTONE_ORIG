<?php

use App\Models\User;

test('changing address cannot bypass a persistent account lock', function () {
    $user = User::factory()->create();
    foreach (range(1, 5) as $attempt) {
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])->post(route('login.store'), [
            'email' => $user->email, 'password' => 'incorrect',
        ]);
    }

    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.20'])->post(route('login.store'), [
        'email' => $user->email, 'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
    expect($user->refresh()->login_locked_at)->not->toBeNull();
});

test('password attempts from one address have an aggregate expiring limit across emails', function () {
    $user = User::factory()->create();
    foreach (range(1, 20) as $attempt) {
        $this->postJson(route('login.store'), ['email' => "absent-{$attempt}@example.test", 'password' => 'incorrect'])
            ->assertUnprocessable();
    }

    $this->postJson(route('login.store'), ['email' => $user->email, 'password' => 'password'])->assertTooManyRequests();
    $this->assertGuest();
    $this->travel(61)->seconds();
    $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
        ->assertSessionHasNoErrors()->assertRedirect();
    $this->assertAuthenticatedAs($user);
});

test('existing account locks still require password recovery for valid credentials', function () {
    $user = User::factory()->create(['failed_login_attempts' => 5, 'login_locked_at' => now()]);

    $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
    expect($user->refresh()->login_locked_at)->not->toBeNull();
});
