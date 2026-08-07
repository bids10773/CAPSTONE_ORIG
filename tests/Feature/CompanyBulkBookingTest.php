<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use App\Services\LaboratoryFormDefinition;
use Inertia\Testing\AssertableInertia as Assert;

test('company accounts always create company bulk appointments', function () {
    $company = Company::create([
        'company_name' => 'Acme Medical Partner',
        'status' => 'active',
        'is_partnered' => true,
    ]);
    $representative = User::factory()->create([
        'role' => 'company',
        'company_id' => $company->id,
    ]);
    $date = today()->addDay();

    $this->actingAs($representative)
        ->post(route('appointments.store'), [
            'type' => 'individual',
            'company_id' => null,
            'appointment_date' => $date->format('Y-m-d'),
            'service_types' => ['PE'],
        ])
        ->assertRedirect(route('appointments.index'));

    $this->assertDatabaseHas('appointments', [
        'user_id' => $representative->id,
        'company_id' => $company->id,
        'company_name' => $company->company_name,
        'type' => 'company_bulk',
        'doctor_id' => null,
        'start_time' => null,
    ]);
});

test('drug and pregnancy tests are optional PE add-ons for company bulk appointments', function () {
    $company = Company::create([
        'company_name' => 'Optional Services Company',
        'status' => 'active',
        'is_partnered' => true,
    ]);
    $account = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);

    $this->actingAs($account)->post(route('appointments.store'), [
        'appointment_date' => today()->addDay()->toDateString(),
        'service_types' => ['PE'],
    ])->assertSessionDoesntHaveErrors();

    $standard = Appointment::query()->latest('id')->firstOrFail();
    expect(array_keys(app(LaboratoryFormDefinition::class)->sectionsFor($standard)))
        ->toBe(['cbc', 'urinalysis', 'fecalysis', 'serology']);

    $this->actingAs($account)->post(route('appointments.store'), [
        'appointment_date' => today()->addDays(2)->toDateString(),
        'service_types' => ['PE', 'Drug Test', 'Pregnancy Test'],
    ])->assertSessionDoesntHaveErrors();

    $withAddOns = Appointment::query()->latest('id')->firstOrFail();
    expect(array_keys(app(LaboratoryFormDefinition::class)->sectionsFor($withAddOns)))
        ->toBe(['cbc', 'urinalysis', 'fecalysis', 'drug_test', 'serology', 'pregnancy']);
});

test('bulk requests have a separate admin approval queue and do not require patient demographics', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = Company::create([
        'company_name' => 'Bulk Request Company',
        'status' => 'active',
        'is_partnered' => true,
    ]);
    $representative = User::factory()->create([
        'role' => 'company',
        'company_id' => $company->id,
    ]);
    $bulk = Appointment::create([
        'user_id' => $representative->id,
        'company_id' => $company->id,
        'appointment_date' => today()->addDay(),
        'type' => 'company_bulk',
        'status' => 'pending',
        'service_types' => ['PE'],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.bulk-appointments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/appointments/index')
            ->where('bulkOnly', true)
            ->has('appointments.data', 1));

    $this->actingAs($admin)
        ->get(route('admin.appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('bulkOnly', false)
            ->has('appointments.data', 0));

    $this->actingAs($admin)
        ->patch(route('admin.appointments.update-status', $bulk), ['status' => 'accepted'])
        ->assertSessionDoesntHaveErrors();

    expect($bulk->refresh()->status)->toBe('accepted');
});

test('individual appointments require complete patient details before admin approval', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['contact' => null]);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today()->addDay(),
        'type' => 'individual',
        'status' => 'pending',
        'service_types' => ['PE'],
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.appointments.update-status', $appointment), ['status' => 'accepted'])
        ->assertSessionHasErrors('profile');

    expect($appointment->refresh()->status)->toBe('pending');

    $patient->update(['contact' => '09123456789']);
    $patient->patientProfile()->create([
        'birthdate' => '1990-01-01',
        'sex' => 'Male',
        'civil_status' => 'Single',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.appointments.update-status', $appointment), ['status' => 'accepted'])
        ->assertSessionDoesntHaveErrors();

    expect($appointment->refresh()->status)->toBe('accepted');
});
