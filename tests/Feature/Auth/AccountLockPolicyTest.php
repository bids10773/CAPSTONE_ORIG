<?php

use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;

beforeEach(fn () => Notification::fake());

test('five failures across IPs and cooldown windows persist until completed password recovery', function () {
    $user = User::factory()->create();
    foreach (range(1, 5) as $attempt) {
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.'.$attempt])
            ->postJson('/login', ['email' => $user->email, 'password' => 'incorrect'])->assertUnprocessable();
        $this->travel(61)->seconds();
    }
    expect($user->refresh()->failed_login_attempts)->toBe(5)
        ->and($user->login_locked_at)->not->toBeNull();

    $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.99'])
        ->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertSessionHasErrors('email');
    $this->assertGuest();

    $this->postJson('/forgot-password', ['email' => $user->email])->assertOk();
    expect($user->refresh()->login_locked_at)->not->toBeNull();
    $this->post('/reset-password', ['email' => $user->email, 'token' => 'invalid', 'password' => 'Hello123', 'password_confirmation' => 'Hello123'])
        ->assertSessionHasErrors();
    expect($user->refresh()->login_locked_at)->not->toBeNull();

    Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
        $this->post('/reset-password', ['email' => $user->email, 'token' => $notification->token, 'password' => 'Hello123', 'password_confirmation' => 'Hello123'])
            ->assertSessionHasNoErrors();

        return true;
    });
    $this->post('/login', ['email' => $user->email, 'password' => 'Hello123'])->assertSessionHasNoErrors();
    $this->assertAuthenticatedAs($user);
});

test('a completed reset permits immediate login from the same throttled email IP pair', function () {
    $user = User::factory()->create();
    foreach (range(1, 5) as $attempt) {
        $this->postJson('/login', ['email' => $user->email, 'password' => 'incorrect'])->assertUnprocessable();
    }
    $this->post('/forgot-password', ['email' => $user->email]);
    Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
        $this->post('/reset-password', ['email' => $user->email, 'token' => $notification->token, 'password' => 'Hello123', 'password_confirmation' => 'Hello123'])
            ->assertSessionHasNoErrors();

        return true;
    });
    $this->post('/login', ['email' => $user->email, 'password' => 'Hello123'])->assertSessionHasNoErrors();
    $this->assertAuthenticatedAs($user);
});

test('an already pending MFA challenge cannot bypass a subsequent account lock', function () {
    $user = User::factory()->withTwoFactor()->create();
    $this->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertRedirect(route('two-factor.login'));
    $user->forceFill(['failed_login_attempts' => 5, 'login_locked_at' => now()])->save();

    $this->post('/two-factor-challenge', ['recovery_code' => 'recovery-code-1'])
        ->assertRedirect(route('login'))->assertSessionMissing('login.id');
    $this->assertGuest();
    expect($user->refresh()->recoveryCodes())->toContain('recovery-code-1');
});

test('sustained IP failures stay blocked after minute windows and successful authentication', function () {
    $user = User::factory()->create();
    foreach (range(1, 50) as $attempt) {
        if ($attempt % 10 === 1) {
            $this->travel(61)->seconds();
        }
        if ($attempt === 41) {
            $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertSessionHasNoErrors();
            $this->post('/logout');
        }
        $this->postJson('/login', ['email' => 'absent-'.$attempt.'@example.test', 'password' => 'incorrect'])->assertUnprocessable();
    }
    $this->travel(61)->seconds();
    $this->postJson('/login', ['email' => $user->email, 'password' => 'password'])->assertTooManyRequests();
    $this->assertGuest();
    expect($user->refresh()->failed_login_attempts)->toBe(0);
    $this->travel(3601)->seconds();
    $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertSessionHasNoErrors();
    $this->assertAuthenticatedAs($user);
});

test('locked accounts keep generic wrong-password errors and audit their transition only once', function () {
    $user = User::factory()->create();
    foreach (range(1, 7) as $attempt) {
        $response = $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.'.$attempt])
            ->postJson('/login', ['email' => $user->email, 'password' => 'incorrect'])->assertUnprocessable();
        $missing = $this->postJson('/login', ['email' => 'absent@example.test', 'password' => 'incorrect'])->assertUnprocessable();
        expect($response->json())->toBe($missing->json());
    }
    expect($user->refresh()->failed_login_attempts)->toBe(5)
        ->and(SecurityAudit::where('action', 'account_locked_after_failed_attempts')->where('target_user_id', $user->id)->count())->toBe(1);
});

test('completing MFA clears consecutive failures but starting a challenge does not', function () {
    $user = User::factory()->withTwoFactor()->create(['failed_login_attempts' => 3]);
    $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect(route('two-factor.login'));
    expect($user->refresh()->failed_login_attempts)->toBe(3);
    $this->post('/two-factor-challenge', ['recovery_code' => 'recovery-code-1'])->assertRedirect();
    $this->assertAuthenticatedAs($user);
    expect($user->refresh()->failed_login_attempts)->toBe(0);
});

test('clearing a request cooldown cannot unlock an account or erase aggregate IP failures', function () {
    $user = User::factory()->create(['failed_login_attempts' => 5, 'login_locked_at' => now()]);
    $request = \Illuminate\Http\Request::create('/login', 'POST', ['email' => $user->email], server: ['REMOTE_ADDR' => '192.0.2.10']);
    $request->setLaravelSession(app('session.store'));
    $limiter = app(\Laravel\Fortify\LoginRateLimiter::class);
    foreach (range(1, 20) as $attempt) {
        $limiter->increment($request);
    }
    $limiter->clear($request);
    expect($limiter->tooManyAttempts($request))->toBeTrue()
        ->and($user->refresh()->isLoginLocked())->toBeTrue();
});

test('a valid remember cookie cannot establish a fresh session for a locked account', function (bool $locked) {
    $user = User::factory()->create($locked ? ['failed_login_attempts' => 5, 'login_locked_at' => now()] : []);
    Route::middleware(['web', 'auth'])->get('/__remembered-account', fn () => response()->json(['id' => Auth::id()]));
    $guard = Auth::guard('web');
    $cookie = $user->id.'|'.$user->remember_token.'|'.$guard->hashPasswordForCookie($user->password);

    $response = $this->withCookie($guard->getRecallerName(), $cookie)->get('/__remembered-account');
    if ($locked) {
        $response->assertRedirect(route('login'));
        $this->assertGuest();
    } else {
        $response->assertOk()->assertJsonPath('id', $user->id);
        $this->assertAuthenticatedAs($user);
    }
})->with([true, false]);

test('final authentication rejects a lock introduced after credential validation', function () {
    $user = User::factory()->create();
    $validatedSnapshot = clone $user;
    $user->forceFill(['failed_login_attempts' => 5, 'login_locked_at' => now()])->save();
    Route::middleware('web')->get('/__finish-authentication', function () use ($validatedSnapshot) {
        Auth::guard('web')->login($validatedSnapshot, true);

        return response()->json(['authenticated' => true]);
    });
    $this->get('/__finish-authentication')->assertRedirect(route('login'));
    $this->assertGuest();
    expect($user->refresh()->isLoginLocked())->toBeTrue();
});
