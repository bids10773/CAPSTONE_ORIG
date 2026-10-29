<?php

use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('admins can view staff details without changing the account or creating alerts', function (string $role) {
    Storage::fake('public');
    Storage::fake('local');
    Storage::disk('public')->put('signatures/staff.png', 'signature');
    Storage::disk('local')->put('licenses/front.png', 'proof');
    $admin = User::factory()->create(['role' => 'admin']);
    $staff = User::factory()->create([
        'role' => $role, 'sex' => 'Female', 'is_active' => false,
        'signature_path' => 'signatures/staff.png',
        'license_document_path' => 'licenses/front.png',
    ]);
    $before = $staff->fresh()->getRawOriginal();
    $this->actingAs($admin)->get('/admin/staff/'.$staff->id)
        ->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('admin/staff/show')
        ->where('staff.id', $staff->id)
        ->where('staff.role', $role)
        ->where('staff.sex', 'Female')
        ->where('staff.is_active', false)
        ->where('staff.has_license_document_front', true)
        ->where('staff.has_license_document_back', false)
        ->where('staff.signature_url', Storage::disk('public')->url('signatures/staff.png'))
        ->missing('staff.password')->missing('staff.two_factor_secret')
        ->missing('staff.license_document_path')->missing('staff.signature_path'));
    expect($staff->fresh()->getRawOriginal())->toBe($before)
        ->and($admin->notifications()->count())->toBe(0);
})->with(['doctor', 'medtech', 'radtech', 'receptionist']);

test('staff detail pages reject non administrators', function (string $role) {
    $viewer = User::factory()->create(['role' => $role]);
    $staff = User::factory()->create(['role' => 'doctor']);
    $this->actingAs($viewer)->get('/admin/staff/'.$staff->id)->assertForbidden();
})->with(['patient', 'company', 'doctor', 'medtech', 'radtech', 'receptionist']);

test('staff details cannot be used to view patient or company accounts', function (string $role) {
    $admin = User::factory()->create(['role' => 'admin']);
    $account = User::factory()->create(['role' => $role]);
    $this->actingAs($admin)->get('/admin/staff/'.$account->id)->assertNotFound();
})->with(['patient', 'company']);

test('staff doctor details show the saved availability with multiple periods and an empty schedule', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $schedule = [
        ['day' => 'mon', 'start' => '08:00', 'end' => '12:00'],
        ['day' => 'mon', 'start' => '13:00', 'end' => '17:00'],
        ['day' => 'wed', 'start' => '09:00', 'end' => '15:00'],
    ];
    $doctor = User::factory()->create(['role' => 'doctor', 'availability' => $schedule]);
    \App\Models\DoctorAvailabilityChangeRequest::create([
        'doctor_id' => $doctor->id, 'current_availability' => $schedule,
        'requested_availability' => [['day' => 'fri', 'start' => '10:00', 'end' => '12:00']],
        'status' => 'pending',
    ]);
    $this->actingAs($admin)->get('/admin/staff/'.$doctor->id)
        ->assertOk()->assertInertia(fn (Assert $page) => $page->where('doctorAvailability', $schedule));
    $doctor->update(['availability' => null]);
    $this->get('/admin/staff/'.$doctor->id)
        ->assertOk()->assertInertia(fn (Assert $page) => $page->where('doctorAvailability', []));
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $this->get('/admin/staff/'.$receptionist->id)
        ->assertOk()->assertInertia(fn (Assert $page) => $page->where('doctorAvailability', null));
});
