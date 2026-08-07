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
