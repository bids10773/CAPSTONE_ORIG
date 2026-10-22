<?php

use App\Enums\InquiryCategory;
use App\Enums\InquiryStatus;
use App\Models\Appointment;
use App\Models\Company;
use App\Models\Inquiry;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

test('an administrator can edit a patient profile', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    PatientProfile::create([
        'user_id' => $patient->id,
        'birthdate' => '2000-01-01',
        'sex' => 'Female',
        'civil_status' => 'Single',
        'address' => 'Old address',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.patients.edit', $patient))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/patients/edit')
            ->where('patient.id', $patient->id));

    $this->patch(route('admin.patients.update', $patient), [
        'first_name' => 'Updated',
        'middle_name' => 'Middle',
        'last_name' => 'Patient',
        'email' => 'updated.patient@example.com',
        'contact' => '09123456789',
        'birthdate' => '2001-02-03',
        'sex' => 'Female',
        'civil_status' => 'Single',
        'address' => 'New address',
        'employee_number' => 'EMP-100',
    ])->assertRedirect(route('admin.patients.index'));

    expect($patient->fresh()->first_name)->toBe('Updated')
        ->and($patient->patientProfile->fresh()->address)->toBe('New address');
});

test('an administrator can delete only a patient without clinical history', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $deletable = User::factory()->create(['role' => 'patient']);
    PatientProfile::create([
        'user_id' => $deletable->id,
        'birthdate' => '2000-01-01',
        'sex' => 'Male',
        'civil_status' => 'Single',
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.patients.destroy', $deletable))
        ->assertRedirect(route('admin.patients.index'));
    $this->assertDatabaseMissing('users', ['id' => $deletable->id]);

    $linked = User::factory()->create(['role' => 'patient']);
    Appointment::create([
        'user_id' => $linked->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => [],
    ]);

    $this->delete(route('admin.patients.destroy', $linked))
        ->assertSessionHas('error');
    $this->assertDatabaseHas('users', ['id' => $linked->id]);
});

test('an administrator can delete an unlinked company and its login account', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = Company::create([
        'company_name' => 'Disposable Company',
        'email' => 'disposable@example.com',
        'contact_number' => '09123456789',
        'status' => 'inactive',
    ]);
    $account = User::factory()->create([
        'role' => 'company',
        'company_id' => $company->id,
        'email' => 'company.login@example.com',
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.companies.destroy', $company))
        ->assertRedirect(route('admin.companies.index'));

    $this->assertDatabaseMissing('companies', ['id' => $company->id]);
    $this->assertDatabaseMissing('users', ['id' => $account->id]);
});

test('an administrator can delete an inquiry', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $inquiry = Inquiry::create([
        'submission_key' => (string) Str::uuid(),
        'category' => InquiryCategory::General,
        'sender_first_name' => 'Test',
        'sender_last_name' => 'Sender',
        'email' => 'sender@example.com',
        'subject' => 'Please remove this inquiry',
        'message' => 'Test message',
        'status' => InquiryStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.inquiries.destroy', $inquiry))
        ->assertRedirect(route('admin.inquiries.index'));

    $this->assertDatabaseMissing('inquiries', ['id' => $inquiry->id]);
});
