<?php

use App\Mail\StaffTemporaryCredentials;
use App\Models\Appointment;
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
        'specialization' => 'General Medicine',
    ], $overrides);
}

test('an administrator creates staff and credentials are emailed without exposing the password', function () {
    Mail::fake();
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post(route('admin.staff.store'), staffPayload());

    $response->assertRedirect(route('admin.staff.index'));
    $staff = User::where('email', 'maria.santos@example.test')->firstOrFail();

    expect($staff->hasVerifiedEmail())->toBeTrue()
        ->and($staff->must_change_password)->toBeTrue()
        ->and($staff->license_no)->toBeNull()
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

test('an administrator can edit a staff account', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $staff = User::factory()->create([
        'role' => 'medtech',
        'first_name' => 'Maria',
        'last_name' => 'Santos',
    ]);
    $originalPassword = $staff->password;

    $this->actingAs($admin)
        ->get(route('admin.staff.edit', $staff))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/staff/edit')
            ->where('staff.id', $staff->id));

    $this->actingAs($admin)
        ->patch(route('admin.staff.update', $staff), [
            'first_name' => 'Marielle',
            'middle_name' => '',
            'last_name' => 'Santos',
            'email' => $staff->email,
            'contact' => '09123456789',
            'role' => 'medtech',
            'license_no' => '12345',
            'specialization' => 'Hematology',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.staff.index'));

    expect($staff->refresh()->first_name)->toBe('Marielle')
        ->and($staff->license_no)->toBe('12345')
        ->and($staff->specialization)->toBe('Hematology')
        ->and($staff->password)->toBe($originalPassword)
        ->and(SecurityAudit::where('action', 'staff_account_updated')->exists())->toBeTrue();
});

test('an administrator cannot change the role of staff linked to clinical work', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);

    Appointment::create([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['CBC'],
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.staff.update', $doctor), [
            'first_name' => $doctor->first_name,
            'middle_name' => $doctor->middle_name,
            'last_name' => $doctor->last_name,
            'email' => $doctor->email,
            'contact' => $doctor->contact,
            'role' => 'medtech',
            'license_no' => $doctor->license_no,
            'specialization' => $doctor->specialization,
            'is_active' => true,
        ])
        ->assertSessionHasErrors('role');

    expect($doctor->refresh()->role)->toBe('doctor');
});

test('an administrator can permanently delete an unlinked staff account', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $staff = User::factory()->create(['role' => 'receptionist']);

    $this->actingAs($admin)
        ->delete(route('admin.staff.destroy', $staff))
        ->assertRedirect(route('admin.staff.index'))
        ->assertSessionHas('success');

    $this->assertModelMissing($staff);
    expect(SecurityAudit::where('action', 'staff_account_deleted')->exists())->toBeTrue();
});
