<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

beforeEach(function () {
    Notification::fake();
    config(['session.driver' => 'database', 'session.connection' => null, 'session.lottery' => [0, 100]]);
});

function sessionClient(Tests\TestCase $test, ?string $sessionId = null): Tests\TestCase
{
    app('session')->driver()->flush();
    app('session')->driver()->setExists(false);
    app('auth')->forgetGuards();
    app()->forgetInstance('auth.driver');

    return $test->withCookies([config('session.cookie') => $sessionId ?? Str::random(40)]);
}

function sessionClientLogin(Tests\TestCase $test, User $user): string
{
    $response = sessionClient($test)->post(route('login.store'), ['email' => $user->email, 'password' => 'password']);
    $response->assertSessionHasNoErrors()->assertRedirect();

    return $response->getCookie(config('session.cookie'))->getValue();
}

test('password recovery revokes all sessions for its account without affecting another account', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $first = sessionClientLogin($this, $user);
    $second = sessionClientLogin($this, $user);
    $unrelated = sessionClientLogin($this, $other);

    sessionClient($this, $first)->get(route('profile.edit'))->assertOk();
    sessionClient($this, $second)->get(route('profile.edit'))->assertOk();
    $token = Password::createToken($user);
    sessionClient($this)->post(route('password.update'), [
        'email' => $user->email,
        'token' => $token,
        'password' => 'Reset-password123!',
        'password_confirmation' => 'Reset-password123!',
    ])->assertSessionHasNoErrors()->assertRedirect(route('login'));

    expect(DB::table('sessions')->where('user_id', $user->id)->count())->toBe(0);
    sessionClient($this, $first)->get(route('profile.edit'))->assertRedirect(route('login'));
    sessionClient($this, $second)->get(route('profile.edit'))->assertRedirect(route('login'));
    sessionClient($this, $unrelated)->get(route('profile.edit'))->assertOk();
    sessionClient($this)->post(route('login.store'), ['email' => $user->email, 'password' => 'Reset-password123!'])
        ->assertSessionHasNoErrors()->assertRedirect();
    $this->assertAuthenticatedAs($user);
});

test('recovery also revokes a legacy session without a password fingerprint', function () {
    $user = User::factory()->create();
    $legacyId = Str::random(40);
    DB::table('sessions')->insert([
        'id' => $legacyId,
        'user_id' => $user->id,
        'payload' => base64_encode(serialize([app('auth')->guard()->getName() => $user->id])),
        'last_activity' => time(),
    ]);
    $token = Password::createToken($user);
    sessionClient($this)->post(route('password.update'), [
        'email' => $user->email,
        'token' => $token,
        'password' => 'Reset-password123!',
        'password_confirmation' => 'Reset-password123!',
    ])->assertSessionHasNoErrors();

    sessionClient($this, $legacyId)->get(route('profile.edit'))->assertRedirect(route('login'));
});

test('changing a password revokes other sessions and remember tokens while retaining the current session', function () {
    $user = User::factory()->create();
    $oldToken = $user->remember_token;
    $current = sessionClientLogin($this, $user);
    $other = sessionClientLogin($this, $user);

    $response = sessionClient($this, $current)->put(route('user-password.update'), [
        'current_password' => 'password',
        'password' => 'Changed-password123!',
        'password_confirmation' => 'Changed-password123!',
    ])->assertSessionHasNoErrors()->assertRedirect();
    $current = $response->getCookie(config('session.cookie'))->getValue();

    expect($user->fresh()->remember_token)->not->toBe($oldToken);
    sessionClient($this, $other)->get(route('profile.edit'))->assertRedirect(route('login'));
    sessionClient($this, $current)->get(route('profile.edit'))->assertOk();
});

test('a session is rejected when its password changes before its first protected request', function () {
    $user = User::factory()->create();
    $sessionId = sessionClientLogin($this, $user);
    $user->update(['password' => 'Changed-password123!']);

    sessionClient($this, $sessionId)->get(route('profile.edit'))->assertRedirect(route('login'));
});

test('a rejected recovery request leaves existing sessions usable', function () {
    $user = User::factory()->create();
    $sessionId = sessionClientLogin($this, $user);

    sessionClient($this)->post(route('password.update'), [
        'email' => $user->email,
        'token' => 'invalid-token',
        'password' => 'Reset-password123!',
        'password_confirmation' => 'Reset-password123!',
    ])->assertSessionHasErrors('email');

    sessionClient($this, $sessionId)->get(route('profile.edit'))->assertOk();
});
