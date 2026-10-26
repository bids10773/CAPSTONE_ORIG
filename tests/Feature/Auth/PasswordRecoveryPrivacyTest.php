<?php

use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Responses\PasswordResetLinkResponse;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;

beforeEach(fn () => Notification::fake());

test('recovery JSON is identical for existing absent and recently requested accounts', function () {
    $user = User::factory()->create();
    $known = $this->postJson(route('password.email'), ['email' => $user->email])->assertOk();
    $absent = $this->postJson(route('password.email'), ['email' => 'absent@example.test'])->assertOk();
    $throttled = $this->postJson(route('password.email'), ['email' => $user->email])->assertOk();

    expect($known->json())->toBe($absent->json())->toBe($throttled->json());
    Notification::assertSentToTimes($user, ResetPassword::class, 1);
});

test('browser recovery uses the same generic status and no existence error', function () {
    $user = User::factory()->create();
    $this->from(route('password.request'))->post(route('password.email'), ['email' => $user->email])
        ->assertRedirect(route('password.request'))->assertSessionHasNoErrors();
    $knownStatus = session('status');

    $this->from(route('password.request'))->post(route('password.email'), ['email' => 'absent@example.test'])
        ->assertRedirect(route('password.request'))->assertSessionHasNoErrors()->assertSessionHas('status', $knownStatus);
});

test('recovery requests have an expiring IP limit independent of email existence', function () {
    $user = User::factory()->create();
    foreach (range(1, 5) as $attempt) {
        $this->postJson(route('password.email'), ['email' => "absent-{$attempt}@example.test"])->assertOk();
    }

    $this->postJson(route('password.email'), ['email' => $user->email])->assertTooManyRequests();
    Notification::assertNothingSent();
    $this->travel(61)->seconds();
    $this->postJson(route('password.email'), ['email' => $user->email])->assertOk();
    Notification::assertSentTo($user, ResetPassword::class);
});

test('recovery email format validation remains enforced', function () {
    $this->postJson(route('password.email'), ['email' => 'invalid'])->assertUnprocessable()->assertJsonValidationErrors('email');
    Notification::assertNothingSent();
});

test('recovery failures do not expose an existence-dependent error response', function () {
    Password::shouldReceive('broker')->once()->andThrow(new RuntimeException('Synthetic recovery service failure'));

    $this->postJson(route('password.email'), ['email' => 'synthetic@example.test'])
        ->assertOk()->assertExactJson(['message' => PasswordResetLinkResponse::MESSAGE]);
});

test('recovery route compiles with its generic controller and request throttle', function () {
    $compiled = Route::getRoutes()->compile();
    $action = $compiled['attributes']['password.email']['action'];

    expect($action['controller'])->toBe(PasswordResetLinkController::class.'@store')
        ->and($action['middleware'])->toContain('web', 'guest', 'throttle:password-reset-link');
});
