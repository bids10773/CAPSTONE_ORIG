<?php

use App\Models\Appointment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function licenseAuthorizationAppointment(User $doctor): Appointment
{
    return Appointment::create([
        'user_id' => User::factory()->create(['role' => 'patient'])->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(), 'type' => 'individual', 'status' => 'arrived',
        'arrived_at' => now(), 'examination_purpose' => 'pre_employment',
        'service_types' => ['PE', 'CBC', 'X-Ray'],
    ]);
}

test('unverified clinical staff cannot open or save examination forms', function (string $role, string $routePrefix, string $status, ?string $license) {
    $staff = User::factory()->create(['role' => $role, 'license_no' => $license, 'license_verification_status' => $status]);
    $doctor = $role === 'doctor' ? $staff : User::factory()->create(['role' => 'doctor']);
    $appointment = licenseAuthorizationAppointment($doctor);
    $this->actingAs($staff)->get(route($routePrefix.'.create', $appointment))->assertForbidden();
    $this->post(route($routePrefix.'.store', $appointment), [])->assertForbidden();
    $this->assertDatabaseCount('physical_exams', 0);
    $this->assertDatabaseCount('lab_results', 0);
    $this->assertDatabaseCount('xray_reports', 0);
})->with([
    ['doctor', 'doctor.physical-exams', 'not_submitted', null],
    ['doctor', 'doctor.physical-exams', 'pending', '1234567'],
    ['doctor', 'doctor.physical-exams', 'rejected', '1234567'],
    ['doctor', 'doctor.physical-exams', 'verified', ''],
    ['medtech', 'medtech.lab-results', 'not_submitted', null],
    ['medtech', 'medtech.lab-results', 'pending', '1234567'],
    ['medtech', 'medtech.lab-results', 'rejected', '1234567'],
    ['medtech', 'medtech.lab-results', 'verified', '   '],
    ['radtech', 'radtech.xrays', 'not_submitted', null],
    ['radtech', 'radtech.xrays', 'pending', '1234567'],
    ['radtech', 'radtech.xrays', 'rejected', '1234567'],
    ['radtech', 'radtech.xrays', 'verified', null],
]);

test('verified clinical staff can open examination forms', function (string $role, string $routePrefix) {
    $staff = User::factory()->create(['role' => $role, 'license_no' => '1234567', 'license_verification_status' => 'verified']);
    $doctor = $role === 'doctor' ? $staff : User::factory()->create(['role' => 'doctor']);
    $appointment = licenseAuthorizationAppointment($doctor);
    $this->actingAs($staff)->get(route($routePrefix.'.create', $appointment))->assertOk();
})->with([
    ['doctor', 'doctor.physical-exams'],
    ['medtech', 'medtech.lab-results'],
    ['radtech', 'radtech.xrays'],
]);

test('doctor verification finalization and report release require a verified license', function (string $ability) {
    $doctor = User::factory()->create(['role' => 'doctor', 'license_no' => '1234567', 'license_verification_status' => 'pending']);
    $appointment = licenseAuthorizationAppointment($doctor);
    $appointment->medicalExamination()->update(['finalized_at' => now()]);
    expect($doctor->can($ability, $appointment))->toBeFalse();
    $doctor->update(['license_verification_status' => 'verified']);
    expect($doctor->can($ability, $appointment))->toBeTrue();
})->with(['verifyDiagnosticResults', 'finalizeMedicalEvaluation', 'releaseMedicalReport']);

test('receptionists can record intake without a professional license', function () {
    $receptionist = User::factory()->create(['role' => 'receptionist', 'license_no' => null, 'license_verification_status' => 'not_submitted']);
    $appointment = licenseAuthorizationAppointment(User::factory()->create(['role' => 'doctor']));
    $this->actingAs($receptionist)->get(route('receptionist.vital-signs.create', $appointment))->assertOk();
});

test('unverified clinicians can access their license settings and see why examinations are blocked', function () {
    $doctor = User::factory()->create(['role' => 'doctor', 'license_no' => null, 'license_verification_status' => 'not_submitted']);
    $this->actingAs($doctor)->get(route('profile.edit'))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('auth.requiresLicenseVerification', true));
});
