<?php

use App\Models\User;

test('authenticated pages protect browser history and disable response caching', function (bool $inertia) {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('dashboard'));
    if ($inertia) {
        $response = $this->get(route('dashboard'), [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $response->viewData('page')['version'],
        ]);
    }

    $response->assertOk();
    expect($response->headers->get('Cache-Control'))->toContain('no-store');
    $response->assertHeader('Pragma', 'no-cache');
    $response->assertHeader('Expires', '0');

    $page = $inertia ? $response->json() : $response->viewData('page');
    expect($page['encryptHistory'])->toBeTrue();
    expect($page['clearHistory'])->toBeFalse();
})->with([false, true]);

test('logout invalidates saved account history when the login page loads', function () {
    $user = User::factory()->create();
    $page = $this->actingAs($user)->get(route('dashboard'))->assertOk()->viewData('page');

    $this->post(route('logout'))->assertRedirect(route('login'));
    $this->assertGuest();

    $this->get(route('login'), ['X-Inertia' => 'true', 'X-Inertia-Version' => $page['version']])
        ->assertOk()
        ->assertJsonPath('clearHistory', true)
        ->assertJsonPath('props.auth.user', null);

    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('guest pages invalidate history after an expired session too', function () {
    $this->get(route('login'))
        ->assertOk()
        ->assertViewHas('page', fn (array $page) => $page['clearHistory'] === true);
});
