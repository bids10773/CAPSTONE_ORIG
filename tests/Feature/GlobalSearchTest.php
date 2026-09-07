<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;

function searchableAppointment(User $patient, array $overrides = []): Appointment
{
    return Appointment::create(array_merge([
        'user_id' => $patient->id,
        'appointment_date' => now(),
        'type' => 'individual',
        'status' => 'pending',
        'service_types' => ['PE'],
    ], $overrides));
}

test('admin global search groups appointments people and companies', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient', 'first_name' => 'Searchable', 'last_name' => 'Patient']);
    $appointment = searchableAppointment($patient);
    $company = Company::create(['company_name' => 'Searchable Industries', 'email' => 'searchable@company.test', 'status' => 'active']);

    $this->actingAs($admin)
        ->getJson(route('api.global-search', ['q' => 'Searchable']))
        ->assertOk()
        ->assertJsonFragment(['id' => 'appointment-'.$appointment->id])
        ->assertJsonFragment(['id' => 'person-'.$patient->id])
        ->assertJsonFragment(['id' => 'company-'.$company->id]);
});

test('patient global search never exposes another patients records', function () {
    $patient = User::factory()->create(['role' => 'patient', 'first_name' => 'Own']);
    $other = User::factory()->create(['role' => 'patient', 'first_name' => 'Private', 'last_name' => 'Person']);
    $ownAppointment = searchableAppointment($patient, ['service_types' => ['CBC']]);
    $privateAppointment = searchableAppointment($other);

    $this->actingAs($patient)
        ->getJson(route('api.global-search', ['q' => 'CBC']))
        ->assertOk()
        ->assertJsonFragment(['id' => 'appointment-'.$ownAppointment->id])
        ->assertJsonMissing(['id' => 'appointment-'.$privateAppointment->id]);

    $this->actingAs($patient)
        ->getJson(route('api.global-search', ['q' => 'Private']))
        ->assertOk()
        ->assertJsonMissing(['id' => 'appointment-'.$privateAppointment->id])
        ->assertJsonCount(0, 'groups');
});

test('doctor global search is restricted to assigned appointments', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $otherDoctor = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient', 'first_name' => 'AssignedSearch']);
    $assigned = searchableAppointment($patient, ['doctor_id' => $doctor->id, 'status' => 'accepted']);
    $unassigned = searchableAppointment($patient, ['doctor_id' => $otherDoctor->id, 'status' => 'accepted']);

    $this->actingAs($doctor)
        ->getJson(route('api.global-search', ['q' => 'AssignedSearch']))
        ->assertOk()
        ->assertJsonFragment(['id' => 'appointment-'.$assigned->id])
        ->assertJsonMissing(['id' => 'appointment-'.$unassigned->id]);
});

test('global search validates short queries and requires authentication', function () {
    $this->getJson(route('api.global-search', ['q' => 'patient']))->assertUnauthorized();

    $user = User::factory()->create(['role' => 'admin']);
    $this->actingAs($user)
        ->getJson(route('api.global-search', ['q' => 'x']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('q');
});

test('global search rejects whitespace and treats sql wildcards literally', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient', 'first_name' => 'WildcardTarget']);
    searchableAppointment($patient);

    $this->actingAs($admin)
        ->getJson(route('api.global-search', ['q' => '  ']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('q');

    $this->getJson(route('api.global-search', ['q' => '%%']))
        ->assertOk()
        ->assertJsonCount(0, 'groups');
});

test('company global search is restricted to its own employees and appointments', function () {
    $ownCompany = Company::create(['company_name' => 'Own Company', 'email' => 'own@company.test', 'status' => 'active']);
    $otherCompany = Company::create(['company_name' => 'Other Company', 'email' => 'other@company.test', 'status' => 'active']);
    $companyUser = User::factory()->create(['role' => 'company', 'company_id' => $ownCompany->id]);
    $ownPatient = User::factory()->create(['role' => 'patient', 'company_id' => $ownCompany->id, 'first_name' => 'ScopedSearch']);
    $otherPatient = User::factory()->create(['role' => 'patient', 'company_id' => $otherCompany->id, 'first_name' => 'ScopedSearch']);
    $ownAppointment = searchableAppointment($ownPatient, ['company_id' => $ownCompany->id]);
    $otherAppointment = searchableAppointment($otherPatient, ['company_id' => $otherCompany->id]);

    $this->actingAs($companyUser)
        ->getJson(route('api.global-search', ['q' => 'ScopedSearch']))
        ->assertOk()
        ->assertJsonFragment(['id' => 'appointment-'.$ownAppointment->id])
        ->assertJsonFragment(['id' => 'person-'.$ownPatient->id])
        ->assertJsonMissing(['id' => 'appointment-'.$otherAppointment->id])
        ->assertJsonMissing(['id' => 'person-'.$otherPatient->id]);
});

test('unlinked company account cannot search unassigned patient records', function () {
    $companyUser = User::factory()->create(['role' => 'company', 'company_id' => null]);
    $patient = User::factory()->create(['role' => 'patient', 'company_id' => null, 'first_name' => 'UnassignedSearch']);
    searchableAppointment($patient, ['company_id' => null]);

    $this->actingAs($companyUser)
        ->getJson(route('api.global-search', ['q' => 'UnassignedSearch']))
        ->assertOk()
        ->assertJsonCount(0, 'groups');
});

test('receptionist and diagnostic global searches stay within their workflow scopes', function () {
    $patient = User::factory()->create(['role' => 'patient', 'first_name' => 'WorkflowSearch']);
    $today = searchableAppointment($patient, ['appointment_date' => today(), 'status' => 'for_diagnostics']);
    $future = searchableAppointment($patient, ['appointment_date' => today()->addDay(), 'status' => 'pending']);

    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $this->actingAs($receptionist)
        ->getJson(route('api.global-search', ['q' => 'WorkflowSearch']))
        ->assertOk()
        ->assertJsonFragment(['id' => 'appointment-'.$today->id])
        ->assertJsonMissing(['id' => 'appointment-'.$future->id]);

    $medtech = User::factory()->create(['role' => 'medtech']);
    $this->actingAs($medtech)
        ->getJson(route('api.global-search', ['q' => 'WorkflowSearch']))
        ->assertOk()
        ->assertJsonFragment(['id' => 'appointment-'.$today->id])
        ->assertJsonMissing(['id' => 'appointment-'.$future->id]);

    $today->update(['status' => 'for_xray']);
    $radtech = User::factory()->create(['role' => 'radtech']);
    $this->actingAs($radtech)
        ->getJson(route('api.global-search', ['q' => 'WorkflowSearch']))
        ->assertOk()
        ->assertJsonFragment(['id' => 'appointment-'.$today->id])
        ->assertJsonMissing(['id' => 'appointment-'.$future->id]);
});
