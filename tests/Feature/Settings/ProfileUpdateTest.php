<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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
        'address' => 'Old Address, Manila',
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
        'address' => 'New Address, Quezon City',
        'role' => 'admin',
        'is_active' => false,
    ])->assertSessionDoesntHaveErrors()->assertRedirect(route('profile.edit'));

    expect($user->refresh())
        ->contact->toBe('639171234567')
        ->role->toBe('patient')
        ->is_active->toBeTrue()
        ->and($user->patientProfile->birthdate->toDateString())->toBe('2003-08-18')
        ->and($user->patientProfile->sex)->toBe('Female')
        ->and($user->patientProfile->civil_status)->toBe('Widowed')
        ->and($user->patientProfile->address)->toBe('New Address, Quezon City');
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
        'address' => 'Test Address, Manila',
    ])->assertSessionHasErrors(['contact', 'birthdate', 'sex', 'civil_status']);
});

test('clinical staff can maintain their professional license number', function (string $role) {
    $staff = User::factory()->create(['role' => $role, 'license_no' => null]);

    $this->actingAs($staff)->patch(route('profile.update'), [
        'first_name' => $staff->first_name,
        'middle_name' => $staff->middle_name,
        'last_name' => $staff->last_name,
        'email' => $staff->email,
        'contact' => $staff->contact,
        'license_no' => '1234567',
    ])->assertSessionHasNoErrors()->assertRedirect(route('profile.edit'));

    expect($staff->refresh()->license_no)->toBe('1234567');
})->with(['doctor', 'medtech', 'radtech']);

test('clinical staff PRC license numbers must contain 5 to 7 digits', function (string $licenseNo) {
    $staff = User::factory()->create(['role' => 'doctor', 'license_no' => null]);

    $this->actingAs($staff)->patch(route('profile.update'), [
        'first_name' => $staff->first_name,
        'middle_name' => $staff->middle_name,
        'last_name' => $staff->last_name,
        'email' => $staff->email,
        'contact' => $staff->contact,
        'license_no' => $licenseNo,
    ])->assertSessionHasErrors('license_no');
})->with(['1234', '12345678', 'PRC123']);

test('patients cannot add a professional license number through profile updates', function () {
    $patient = User::factory()->create(['role' => 'patient', 'license_no' => null]);

    $this->actingAs($patient)->patch(route('profile.update'), [
        'first_name' => $patient->first_name,
        'middle_name' => $patient->middle_name,
        'last_name' => $patient->last_name,
        'email' => $patient->email,
        'license_no' => 'NOT-A-CLINICIAN',
    ])->assertSessionHasNoErrors();

    expect($patient->refresh()->license_no)->toBeNull();
});

test('clinical staff can upload their own electronic signature', function () {
    Storage::fake('public');
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'license_no' => '12345',
    ]);
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL8WQAAAABJRU5ErkJggg==');

    $this->actingAs($doctor)
        ->post(route('profile.signature.update'), [
            'signature' => UploadedFile::fake()->createWithContent('signature.png', $png),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $doctor->refresh();
    Storage::disk('public')->assertExists($doctor->signature_path);
    expect($doctor->signatureDataUri())->toStartWith('data:image/png;base64,');
    $this->assertDatabaseHas('security_audits', [
        'actor_id' => $doctor->id,
        'target_user_id' => $doctor->id,
        'action' => 'electronic_signature_updated',
        'status' => 'success',
    ]);
});

test('patients cannot upload an electronic signature', function () {
    Storage::fake('public');
    $patient = User::factory()->create(['role' => 'patient']);
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL8WQAAAABJRU5ErkJggg==');

    $this->actingAs($patient)
        ->post('/settings/profile/signature', [
            'signature' => UploadedFile::fake()->createWithContent('signature.png', $png),
        ])
        ->assertForbidden();
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
