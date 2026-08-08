<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\CompanyReferral;
use App\Models\User;
use App\Notifications\CompanyMedicalReferralInvitation;
use App\Services\CompanyReferralService;
use Illuminate\Support\Facades\Notification;

beforeEach(fn () => Notification::fake());

function referralCompanyAccount(string $name = 'Referral Company'): array
{
    $company = Company::create(['company_name' => $name, 'status' => 'active']);
    $account = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);

    return [$company, $account];
}

function referralData(array $overrides = []): array
{
    return array_merge([
        'first_name' => 'Juan',
        'last_name' => 'Cruz',
        'email' => 'juan.referral@example.com',
        'service_types' => ['PE', 'CBC', 'X-Ray'],
    ], $overrides);
}

test('company creates a referral linked to an existing patient without duplicating identity', function () {
    [$company, $account] = referralCompanyAccount();
    $patient = User::factory()->create([
        'role' => 'patient',
        'email' => 'juan.referral@example.com',
        'first_name' => 'Juan',
        'middle_name' => 'Santos',
        'last_name' => 'Cruz',
    ]);
    $patient->patientProfile()->create(['birthdate' => '1995-05-10', 'sex' => 'Male', 'civil_status' => 'Single']);

    $this->actingAs($account)->post(route('company.referrals.store'), referralData())
        ->assertSessionDoesntHaveErrors();

    $referral = CompanyReferral::firstOrFail();
    expect($referral->company_id)->toBe($company->id)
        ->and($referral->patient_id)->toBe($patient->id)
        ->and($referral->required_services)->toBe(['PE', 'CBC', 'X-Ray'])
        ->and($referral->valid_until->toDateString())->toBe(today()->addDays(30)->toDateString())
        ->and(User::where('email', 'juan.referral@example.com')->count())->toBe(1);
    Notification::assertSentOnDemand(CompanyMedicalReferralInvitation::class);
});

test('matching patient securely accepts referral and company services override booking input', function () {
    [$company, $account] = referralCompanyAccount();
    $patient = User::factory()->create([
        'role' => 'patient',
        'email' => 'juan.referral@example.com',
        'contact' => '09171234567',
    ]);
    $patient->patientProfile()->create(['birthdate' => '1995-05-10', 'sex' => 'Male', 'civil_status' => 'Single']);
    $referral = app(CompanyReferralService::class)->create($account, referralData());
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'is_active' => true,
        'availability' => [['day' => strtolower(today()->addDay()->format('D')), 'start' => '09:00', 'end' => '10:00']],
    ]);

    $referral->update(['patient_id' => $patient->id, 'status' => 'viewed']);
    $this->actingAs($patient)->post(route('appointments.store'), [
        'company_referral_id' => $referral->id,
        'type' => 'individual',
        'company_id' => null,
        'doctor_id' => $doctor->id,
        'appointment_date' => today()->addDay()->toDateString(),
        'start_time' => '09:00',
        'service_types' => ['Urinalysis'],
    ])->assertSessionDoesntHaveErrors();

    $appointment = Appointment::firstOrFail();
    expect($appointment->type)->toBe('company_referral')
        ->and($appointment->company_id)->toBe($company->id)
        ->and($appointment->service_types)->toBe(['PE', 'CBC', 'X-Ray'])
        ->and($appointment->company_referral_id)->toBe($referral->id)
        ->and($referral->refresh()->status)->toBe('scheduled');
});

test('expired referrals cannot be scheduled and another company cannot cancel them', function () {
    [$company, $account] = referralCompanyAccount('Owner Company');
    [, $otherAccount] = referralCompanyAccount('Other Company');
    $patient = User::factory()->create(['role' => 'patient', 'email' => 'expired@example.com', 'contact' => '09170000000']);
    $patient->patientProfile()->create(['birthdate' => '1990-01-01', 'sex' => 'Male', 'civil_status' => 'Single']);
    $referral = CompanyReferral::create([
        'company_id' => $company->id,
        'patient_id' => $patient->id,
        'created_by' => $account->id,
        'referral_number' => 'REF-EXPIRED-001',
        'invitation_token_hash' => hash('sha256', 'expired-token'),
        'employee_email' => $patient->email,
        'first_name' => $patient->first_name,
        'last_name' => $patient->last_name,
        'birthdate' => '1990-01-01',
        'sex' => 'Male',
        'required_services' => ['PE'],
        'valid_until' => today()->subDay(),
        'status' => 'sent',
    ]);

    $this->actingAs($patient)
        ->get(route('appointment.create', ['referral' => $referral->id]))
        ->assertStatus(422);
    $this->actingAs($otherAccount)
        ->patch(route('company.referrals.cancel', $referral), ['reason' => 'Unauthorized'])
        ->assertForbidden();
});

test('company cannot open a referred patients detailed clinical appointment', function () {
    [$company, $account] = referralCompanyAccount();
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'company_id' => $company->id,
        'appointment_date' => today(),
        'type' => 'company_referral',
        'status' => 'accepted',
        'service_types' => ['PE'],
    ]);

    $this->actingAs($account)->get(route('appointments.show', $appointment))->assertForbidden();
});

test('patient cannot create an unlinked company referral appointment', function () {
    [, $account] = referralCompanyAccount();
    $patient = User::factory()->create(['role' => 'patient', 'contact' => '09171234567']);
    $patient->patientProfile()->create(['birthdate' => '1995-05-10', 'sex' => 'Male', 'civil_status' => 'Single']);
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'is_active' => true,
        'availability' => [['day' => strtolower(today()->addDay()->format('D')), 'start' => '09:00', 'end' => '10:00']],
    ]);

    $this->actingAs($patient)->post(route('appointments.store'), [
        'type' => 'company_referral',
        'company_id' => $account->company_id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today()->addDay()->toDateString(),
        'start_time' => '09:00',
        'service_types' => ['PE'],
    ])->assertSessionHasErrors('company_referral_id');

    expect(Appointment::count())->toBe(0);
});
