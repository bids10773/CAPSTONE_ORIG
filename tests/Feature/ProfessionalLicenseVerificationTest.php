<?php

use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('clinical staff can privately submit license proof for review', function () {
    Storage::fake('local');
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'license_no' => '1234567',
    ]);

    $this->actingAs($doctor)
        ->post(route('profile.license-document.update'), [
            'license_document_front' => UploadedFile::fake()->image('prc-front.jpg'),
            'license_document_back' => UploadedFile::fake()->image('prc-back.jpg'),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $doctor->refresh();
    expect($doctor->license_verification_status)->toBe('pending')
        ->and($doctor->license_document_path)->not->toBeNull()
        ->and($doctor->license_document_back_path)->not->toBeNull();
    Storage::disk('local')->assertExists($doctor->license_document_path);
    Storage::disk('local')->assertExists($doctor->license_document_back_path);
    expect(SecurityAudit::where('action', 'professional_license_submitted')->exists())->toBeTrue();
});

test('patients cannot submit professional license proof', function () {
    Storage::fake('local');
    $patient = User::factory()->create(['role' => 'patient']);

    $this->actingAs($patient)
        ->post('/settings/profile/license-document', [
            'license_document_front' => UploadedFile::fake()->image('prc-front.jpg'),
            'license_document_back' => UploadedFile::fake()->image('prc-back.jpg'),
        ])
        ->assertForbidden();
});

test('an administrator can download and verify submitted license proof', function () {
    Storage::fake('local');
    $admin = User::factory()->create(['role' => 'admin']);
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'license_no' => '7654321',
        'license_verification_status' => 'pending',
        'license_document_path' => 'license-documents/doctor/front.jpg',
        'license_document_back_path' => 'license-documents/doctor/back.jpg',
    ]);
    Storage::disk('local')->put($doctor->license_document_path, 'proof');
    Storage::disk('local')->put($doctor->license_document_back_path, 'proof');

    $this->actingAs($admin)
        ->get(route('admin.staff.license-document.download', [$doctor, 'front']))
        ->assertOk()
        ->assertDownload('prc-id-front.jpg');
    $this->actingAs($admin)
        ->get(route('admin.staff.license-document.download', [$doctor, 'back']))
        ->assertOk()
        ->assertDownload('prc-id-back.jpg');

    $this->actingAs($admin)
        ->patch(route('admin.staff.license-verification.update', $doctor), [
            'status' => 'verified',
        ])
        ->assertSessionHasNoErrors();

    expect($doctor->refresh()->license_verification_status)->toBe('verified')
        ->and($doctor->license_verified_by)->toBe($admin->id)
        ->and($doctor->license_verified_at)->not->toBeNull();
    expect(SecurityAudit::where('action', 'professional_license_verified')->exists())->toBeTrue();
});

test('changing a license number removes old proof and requires verification again', function () {
    Storage::fake('local');
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'license_no' => '12345',
        'license_verification_status' => 'verified',
        'license_document_path' => 'license-documents/doctor/old-front.jpg',
        'license_document_back_path' => 'license-documents/doctor/old-back.jpg',
        'license_verified_at' => now(),
    ]);
    Storage::disk('local')->put($doctor->license_document_path, 'old proof');
    Storage::disk('local')->put($doctor->license_document_back_path, 'old proof');
    $oldBackPath = $doctor->license_document_back_path;

    $this->actingAs($doctor)->patch(route('profile.update'), [
        'first_name' => $doctor->first_name,
        'middle_name' => $doctor->middle_name,
        'last_name' => $doctor->last_name,
        'email' => $doctor->email,
        'contact' => $doctor->contact,
        'license_no' => '654321',
    ])->assertSessionHasNoErrors();

    $doctor->refresh();
    expect($doctor->license_verification_status)->toBe('not_submitted')
        ->and($doctor->license_document_path)->toBeNull()
        ->and($doctor->license_document_back_path)->toBeNull()
        ->and($doctor->license_verified_at)->toBeNull();
    Storage::disk('local')->assertMissing('license-documents/doctor/old-front.jpg');
    Storage::disk('local')->assertMissing($oldBackPath);
});

test('reports only display verified professional license numbers', function () {
    $doctor = User::factory()->make([
        'role' => 'doctor',
        'license_no' => '1111111',
        'license_verification_status' => 'pending',
    ]);

    expect(view('pdf.partials.electronic-signature', ['staff' => $doctor])->render())
        ->not->toContain('1111111');

    $doctor->license_verification_status = 'verified';

    expect(view('pdf.partials.electronic-signature', ['staff' => $doctor])->render())
        ->toContain('1111111');
});

test('license submissions require both ID images', function () {
    Storage::fake('local');
    $doctor = User::factory()->create(['role' => 'doctor', 'license_no' => '12345']);

    $this->actingAs($doctor)
        ->post(route('profile.license-document.update'), [
            'license_document_front' => UploadedFile::fake()->image('prc-front.jpg'),
        ])
        ->assertSessionHasErrors('license_document_back');
});
