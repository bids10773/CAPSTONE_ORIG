<?php

use App\Mail\StaffTemporaryCredentials;
use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

function staffPayload(array $overrides = []): array
{
    return array_merge([
        'first_name' => 'Maria',
        'middle_name' => null,
        'last_name' => 'Santos',
        'email' => 'maria.santos@example.test',
        'contact' => '09123456789',
        'role' => 'doctor',
        'license_no' => '1234567',
        'specialization' => 'General Medicine',
    ], $overrides);
}

test('an administrator creates staff and credentials are emailed without exposing the password', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post(route('admin.staff.store'), staffPayload());

    $response->assertRedirect(route('admin.staff.index'));
    $staff = User::where('email', 'maria.santos@example.test')->firstOrFail();

    expect($staff->must_change_password)->toBeTrue()
        ->and($staff->temporary_password_created_at)->not->toBeNull()
        ->and($staff->temporary_password_expires_at)->not->toBeNull()
        ->and($staff->password)->not->toBeEmpty();

    Mail::assertSent(StaffTemporaryCredentials::class, function (StaffTemporaryCredentials $mail) use ($staff) {
        expect(Hash::check($mail->temporaryPassword, $staff->password))->toBeTrue();

        return $mail->hasTo($staff->email);
    });
    expect(SecurityAudit::where('action', 'staff_account_created_credentials_sent')->exists())->toBeTrue();
});

test('duplicate email and invalid roles are rejected', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->create(['email' => 'maria.santos@example.test']);

    $this->actingAs($admin)
        ->post(route('admin.staff.store'), staffPayload(['role' => 'admin']))
        ->assertSessionHasErrors(['email', 'role']);

    Mail::assertNothingSent();
});

test('staff creation is rolled back when email delivery fails', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Mail::shouldReceive('to')->once()->andThrow(new RuntimeException('SMTP unavailable'));

    $this->actingAs($admin)
        ->post(route('admin.staff.store'), staffPayload())
        ->assertSessionHas('error');

    expect(User::where('email', 'maria.santos@example.test')->exists())->toBeFalse()
        ->and(SecurityAudit::where('action', 'staff_account_creation_failed')->exists())->toBeTrue();
});

test('temporary staff are forced to change password and cannot bypass the page', function () {
    $staff = User::factory()->create([
        'role' => 'doctor',
        'password' => Hash::make('TempPass!234567'),
        'must_change_password' => true,
        'temporary_password_created_at' => now(),
        'temporary_password_expires_at' => now()->addHours(48),
    ]);

    $this->post(route('login.store'), [
        'email' => $staff->email,
        'password' => 'TempPass!234567',
    ])->assertRedirect(route('temporary-password.edit'));

    $this->get(route('doctor.dashboard'))->assertRedirect(route('temporary-password.edit'));
    $this->get(route('temporary-password.edit'))->assertOk();
});

test('staff can replace a valid temporary password', function () {
    $staff = User::factory()->create([
        'role' => 'doctor',
        'password' => Hash::make('TempPass!234567'),
        'must_change_password' => true,
        'temporary_password_created_at' => now(),
        'temporary_password_expires_at' => now()->addHours(48),
    ]);

    $this->actingAs($staff)
        ->put(route('temporary-password.update'), [
            'current_password' => 'TempPass!234567',
            'password' => 'PrivatePass!98765',
            'password_confirmation' => 'PrivatePass!98765',
        ])
        ->assertRedirect('/doctor/dashboard');

    $staff->refresh();
    expect($staff->must_change_password)->toBeFalse()
        ->and($staff->temporary_password_expires_at)->toBeNull()
        ->and(Hash::check('PrivatePass!98765', $staff->password))->toBeTrue()
        ->and(SecurityAudit::where('action', 'temporary_password_changed')->exists())->toBeTrue();
});

test('expired temporary credentials cannot access protected routes', function () {
    $staff = User::factory()->create([
        'role' => 'doctor',
        'must_change_password' => true,
        'temporary_password_expires_at' => now()->subMinute(),
    ]);

    $this->actingAs($staff)
        ->get(route('doctor.dashboard'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
});

test('administrator can rotate and resend unused temporary credentials', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);
    $staff = User::factory()->create([
        'role' => 'medtech',
        'must_change_password' => true,
        'temporary_password_created_at' => now()->subHour(),
        'temporary_password_expires_at' => now()->addHour(),
    ]);
    $oldHash = $staff->password;

    $this->actingAs($admin)
        ->post(route('admin.staff.resend-credentials', $staff))
        ->assertSessionHas('success');

    $staff->refresh();
    expect($staff->password)->not->toBe($oldHash)
        ->and($staff->temporary_password_expires_at->isAfter(now()->addHours(47)))->toBeTrue();
    Mail::assertSent(StaffTemporaryCredentials::class, fn ($mail) => $mail->hasTo($staff->email));
});

test('non administrators cannot create staff or resend credentials', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $staff = User::factory()->create(['role' => 'doctor', 'must_change_password' => true]);

    $this->actingAs($patient)
        ->post(route('admin.staff.store'), staffPayload())
        ->assertForbidden();

    $this->actingAs($patient)
        ->post(route('admin.staff.resend-credentials', $staff))
        ->assertForbidden();
});
