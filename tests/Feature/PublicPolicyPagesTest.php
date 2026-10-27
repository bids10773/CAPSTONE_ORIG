<?php

it('makes policy pages accessible without authentication', function (string $path, string $heading) {
    $this->get($path)
        ->assertOk()
        ->assertSee($heading)
        ->assertSee('Living Myth Industrial Clinic')
        ->assertSee('livingmythindustrialclinic@gmail.com')
        ->assertDontSee('REPLACE_WITH_PRIVACY_EMAIL')
        ->assertDontSee('[INSERT')
        ->assertDontSee('Before publishing:')
        ->assertSee(url('/privacy-policy'))
        ->assertSee(url('/terms'))
        ->assertSee(url('/data-deletion'));

    $this->assertGuest();
})->with([
    ['/privacy-policy', 'Privacy Policy'],
    ['/data-deletion', 'Facebook-Linked Data Deletion'],
    ['/terms', 'Terms and Conditions'],
]);
