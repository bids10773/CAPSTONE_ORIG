<?php

use App\Models\User;

test('successful patient registration notifies active admins without private profile values', function () {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $inactive = User::factory()->create(['role' => 'admin', 'is_active' => false]);
    $this->post(route('register.store'), ['first_name' => 'Private', 'last_name' => 'Patient', 'email' => 'private-registration@example.com', 'contact' => '09171234567', 'birthdate' => '1990-01-01', 'sex' => 'Male', 'civil_status' => 'Single', 'address' => 'Private Street', 'password' => 'Hello123', 'password_confirmation' => 'Hello123'])->assertSessionHasNoErrors();
    $patient = User::where('email', 'private-registration@example.com')->firstOrFail();
    $notice = $admin->notifications()->where('data->type', 'patient_registered')->first();
    expect($notice)->not->toBeNull();
    expect($notice->data['url'])->toBe(route('admin.patients.show', $patient, false))
        ->and(json_encode($notice->data))->not->toContain('Private Street', '09171234567', '1990-01-01', 'private-registration@example.com')
        ->and($inactive->notifications()->count())->toBe(0)
        ->and($patient->notifications()->where('data->type', 'patient_registered')->count())->toBe(0);
});

test('meaningful self profile edits notify admins once and no op saves stay silent', function (string $role) {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $user = User::factory()->create(['role' => $role, 'is_active' => true]);
    $data = ['first_name' => 'Updated', 'last_name' => $user->last_name, 'email' => $user->email];
    $this->actingAs($user)->patch(route('profile.update'), $data)->assertSessionHasNoErrors();
    expect($admin->notifications()->where('data->type', 'profile_updated')->count())->toBe(1)
        ->and($user->notifications()->where('data->type', 'profile_updated')->count())->toBe(0);
    $this->patch(route('profile.update'), $data)->assertSessionHasNoErrors();
    expect($admin->notifications()->where('data->type', 'profile_updated')->count())->toBe(1);
})->with(['patient', 'doctor', 'medtech', 'radtech', 'receptionist', 'company']);

test('patient profile completion emits one completion event including profile only changes', function () {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $patient = User::factory()->create(['role' => 'patient', 'contact' => '639171234567']);
    $patient->patientProfile()->create(['birthdate' => '1990-01-01', 'sex' => 'Male', 'civil_status' => 'Single']);
    $data = ['first_name' => $patient->first_name, 'last_name' => $patient->last_name, 'email' => $patient->email, 'address' => 'Private New Street'];
    $this->actingAs($patient)->patch(route('profile.update'), $data)->assertSessionHasNoErrors();
    expect($admin->notifications()->where('data->type', 'patient_profile_completed')->count())->toBe(1)
        ->and($admin->notifications()->where('data->type', 'profile_updated')->count())->toBe(0);
    $this->patch(route('profile.update'), $data)->assertSessionHasNoErrors();
    expect($admin->notifications()->where('data->type', 'patient_profile_completed')->count())->toBe(1);
});

test('license only self edits preserve their dedicated notice without a generic profile notice', function () {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $doctor = User::factory()->licensed()->create(['role' => 'doctor']);
    $this->actingAs($doctor)->patch(route('profile.update'), ['first_name' => $doctor->first_name, 'last_name' => $doctor->last_name, 'email' => $doctor->email, 'license_no' => '9876543'])->assertSessionHasNoErrors();
    expect($admin->notifications()->where('data->type', 'profile_updated')->count())->toBe(0)
        ->and($admin->notifications()->where('data->type', 'professional_license_changed')->count())->toBe(1);
});

test('new social registrations notify admins once without provider or profile details', function (bool $collectEmail) {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $inactive = User::factory()->create(['role' => 'admin', 'is_active' => false]);
    if ($collectEmail) {
        $this->withSession(['social_registration' => [
            'provider' => 'facebook', 'provider_user_id' => 'private-provider-identifier', 'name' => 'Private Social Patient',
        ]])->post(route('social.email.store'), ['email' => 'private-social@example.com'])->assertSessionHasNoErrors();
    } else {
        $identity = (new \Laravel\Socialite\Two\User)->map([
            'id' => 'private-provider-identifier', 'name' => 'Private Social Patient', 'email' => 'private-social@example.com',
        ])->setRaw(['email_verified' => true]);
        $driver = \Mockery::mock();
        $driver->shouldReceive('user')->twice()->andReturn($identity);
        \Laravel\Socialite\Facades\Socialite::shouldReceive('driver')->with('google')->twice()->andReturn($driver);
        $this->get(route('social.callback', 'google'))->assertRedirect(route('patient-profile.complete'));
        \Illuminate\Support\Facades\Auth::logout();
        $this->get(route('social.callback', 'google'))->assertRedirect(route('patient-profile.complete'));
    }
    $patient = User::where('email', 'private-social@example.com')->firstOrFail();
    $notices = $admin->notifications()->where('data->type', 'patient_registered')->get();
    expect($notices)->toHaveCount(1);
    expect($notices[0]->data['url'])->toBe(route('admin.patients.show', $patient, false))
        ->and(json_encode($notices[0]->data))->not->toContain('Private Social Patient', 'private-social@example.com', 'private-provider-identifier')
        ->and($inactive->notifications()->count())->toBe(0);
})->with([true, false]);

test('mandatory patient profile completion notifies admins once across repeated submissions', function () {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $inactive = User::factory()->create(['role' => 'admin', 'is_active' => false]);
    $patient = User::factory()->create(['role' => 'patient', 'contact' => null]);
    $patient->patientProfile()->create([]);
    $data = [
        'first_name' => 'Private', 'last_name' => 'Patient', 'birthdate' => '1990-01-01',
        'sex' => 'Male', 'civil_status' => 'Single', 'contact' => '09171234567', 'address' => 'Private Completion Street',
    ];
    $this->actingAs($patient)->put('/complete-patient-profile', $data)->assertRedirect(route('dashboard'));
    $this->put('/complete-patient-profile', $data)->assertRedirect(route('dashboard'));
    $notices = $admin->notifications()->where('data->type', 'patient_profile_completed')->get();
    expect($notices)->toHaveCount(1);
    expect($notices[0]->data['url'])->toBe(route('admin.patients.show', $patient, false))
        ->and(json_encode($notices[0]->data))->not->toContain('Private Completion Street', '09171234567', '1990-01-01')
        ->and($inactive->notifications()->count())->toBe(0);
});
