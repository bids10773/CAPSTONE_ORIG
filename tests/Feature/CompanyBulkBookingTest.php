<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use App\Services\BulkAppointmentEnrollmentService;
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
            'service_location' => 'onsite', 'event_address' => 'Acme Plant',
            'event_contact_name' => 'Ana Cruz', 'event_contact_number' => '09171234567',
            'expected_employee_count' => 100,
        ])
        ->assertRedirectContains('/company/dashboard?bulk_upload=');

    $this->assertDatabaseHas('appointments', [
        'user_id' => $representative->id,
        'company_id' => $company->id,
        'company_name' => $company->company_name,
        'type' => 'company_bulk',
        'examination_purpose' => 'annual_pe',
        'doctor_id' => null,
        'start_time' => '08:00',
    ]);
});

test('pre employment selects five basics while other bulk services remain optional', function () {
    $company = Company::create([
        'company_name' => 'Optional Services Company',
        'status' => 'active',
        'is_partnered' => true,
    ]);
    $account = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);

    $this->actingAs($account)->post(route('appointments.store'), [
        'appointment_date' => today()->addDay()->toDateString(),
        'service_types' => ['PE'],
        'examination_purpose' => 'pre_employment',
        'service_location' => 'clinic', 'event_contact_name' => 'Ana Cruz',
        'event_contact_number' => '09171234567', 'expected_employee_count' => 100,
    ])->assertSessionDoesntHaveErrors();

    $standard = Appointment::query()->latest('id')->firstOrFail();
    expect($standard->service_types)->toBe(['PE', 'CBC', 'Urinalysis', 'Fecalysis', 'X-Ray'])
        ->and(array_keys(app(LaboratoryFormDefinition::class)->sectionsFor($standard)))
        ->toBe(['cbc', 'urinalysis', 'fecalysis']);

    $this->actingAs($account)->post(route('appointments.store'), [
        'appointment_date' => today()->addDays(2)->toDateString(),
        'service_types' => ['PE', 'Drug Test', 'Pregnancy Test'],
        'examination_purpose' => 'pre_employment',
        'service_location' => 'clinic', 'event_contact_name' => 'Ana Cruz',
        'event_contact_number' => '09171234567', 'expected_employee_count' => 100,
    ])->assertSessionDoesntHaveErrors();

    $withAddOns = Appointment::query()->latest('id')->firstOrFail();
    expect(array_keys(app(LaboratoryFormDefinition::class)->sectionsFor($withAddOns)))
        ->toBe(['cbc', 'urinalysis', 'fecalysis', 'drug_test', 'pregnancy']);
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
    $employee = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);
    app(BulkAppointmentEnrollmentService::class)->enroll($bulk, $employee);

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

test('draft bulk requests stay hidden until a masterlist is attached and empty requests cannot be approved', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = Company::create(['company_name' => 'Draft Masterlist Company']);
    $representative = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $draft = Appointment::create([
        'user_id' => $representative->id, 'company_id' => $company->id,
        'appointment_date' => today()->addDay(), 'type' => 'company_bulk',
        'status' => 'pending', 'onsite_event_status' => 'draft', 'service_types' => ['PE'],
    ]);

    $this->actingAs($admin)->get(route('admin.bulk-appointments.index'))
        ->assertInertia(fn (Assert $page) => $page->has('appointments.data', 0));
    $this->actingAs($admin)->get(route('admin.onsite-events.show', $draft))->assertNotFound();
    $this->actingAs($admin)->patch(route('admin.appointments.update-status', $draft), ['status' => 'accepted'])
        ->assertSessionHasErrors('masterlist');
    expect($draft->refresh()->status)->toBe('pending');
});

test('admin bulk request queue contains parent events but not enrolled employee appointments', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = Company::create(['company_name' => 'Parent Queue Company']);
    $representative = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $employee = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);
    $parent = Appointment::create([
        'user_id' => $representative->id, 'company_id' => $company->id,
        'appointment_date' => today()->addDay(), 'type' => 'company_bulk',
        'status' => 'accepted', 'service_types' => ['PE'],
    ]);
    app(BulkAppointmentEnrollmentService::class)->enroll($parent, $employee);

    $this->actingAs($admin)->get(route('admin.bulk-appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('appointments.data', 1)
            ->where('appointments.data.0.id', $parent->id)
            ->where('appointments.data.0.bulk_employees_count', 1));

    $this->actingAs($admin)->get(route('admin.onsite-events.show', $parent))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/onsite-events/show')
            ->where('attendance.total', 1)
            ->has('employees.data', 1)
            ->where('employees.data.0.user.id', $employee->id));
});

test('individual appointments require complete patient details before admin approval', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['contact' => null]);
    $appointmentDate = today()->addDay();
    $doctor = User::factory()->create([
        'role' => 'doctor',
        'is_active' => true,
        'availability' => [[
            'day' => strtolower($appointmentDate->format('D')),
            'start' => '08:00',
            'end' => '12:00',
        ]],
    ]);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => $appointmentDate,
        'start_time' => '09:00',
        'end_time' => '09:30',
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

test('bulk approval schedules every enrolled employee independently under the parent batch', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = Company::create(['company_name' => 'Independent Workflow Company']);
    $representative = User::factory()->create([
        'role' => 'company',
        'company_id' => $company->id,
    ]);
    $employeeA = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);
    $employeeB = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);
    $parent = Appointment::create([
        'user_id' => $representative->id,
        'company_id' => $company->id,
        'company_name' => $company->company_name,
        'appointment_date' => today()->addDay(),
        'type' => 'company_bulk',
        'status' => 'pending',
        'service_types' => ['PE', 'CBC', 'X-Ray'],
    ]);
    $enrollment = app(BulkAppointmentEnrollmentService::class);
    $childA = $enrollment->enroll($parent, $employeeA);
    $childB = $enrollment->enroll($parent, $employeeB);

    expect($parent->medicalExamination)->toBeNull()
        ->and($childA->status)->toBe('pending')
        ->and($childA->bulk_appointment_id)->toBe($parent->id)
        ->and($childB->batch_id)->toBe($childA->batch_id)
        ->and($childA->medicalExamination)->not->toBeNull();

    $this->actingAs($admin)
        ->patch(route('admin.appointments.update-status', $parent), ['status' => 'accepted'])
        ->assertSessionDoesntHaveErrors();

    expect($childA->refresh()->status)->toBe('accepted')
        ->and($childB->refresh()->status)->toBe('accepted');

    $childA->update(['status' => 'completed']);
    expect($childB->refresh()->status)->toBe('accepted')
        ->and($parent->refresh()->status)->toBe('arrived');

    $childB->update(['status' => 'completed']);
    expect($parent->refresh()->status)->toBe('completed');
});

test('receptionist checks in bulk employees only through assigned bulk attendance', function () {
    $company = Company::create(['company_name' => 'Arrival Company']);
    $representative = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $employee = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $parent = Appointment::create([
        'user_id' => $representative->id,
        'company_id' => $company->id,
        'appointment_date' => today(),
        'start_time' => '08:00',
        'end_time' => '17:00',
        'type' => 'company_bulk',
        'status' => 'accepted',
        'service_types' => ['PE'],
    ]);
    $child = app(BulkAppointmentEnrollmentService::class)->enroll($parent, $employee);
    app(\App\Services\OnsiteEventWorkflowService::class)->assignStaff($parent, $receptionist, 'receptionist', 10);

    $this->actingAs($receptionist)
        ->get(route('receptionist.queue.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('walkIns.data', 0));

    $this->get(route('receptionist.onsite-events.show', $parent))
        ->assertInertia(fn (Assert $page) => $page->has('employees.data', 1)->where('employees.data.0.id', $child->id));

    $this->patch(route('receptionist.onsite-employees.attendance', $child), ['attendance_status' => 'arrived'])
        ->assertSessionDoesntHaveErrors();

    expect($child->refresh()->status)->toBe('arrived')
        ->and($child->arrived_at)->not->toBeNull();
});

test('company employee bookings show completed bulk children but not parent events or other companies', function () {
    $company = Company::create(['company_name' => 'Employee Status Company', 'status' => 'active']);
    $account = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $event = Appointment::create([
        'user_id' => $account->id,
        'company_id' => $company->id,
        'appointment_date' => today(),
        'start_time' => '08:00',
        'end_time' => '17:00',
        'type' => 'company_bulk',
        'status' => 'accepted',
        'service_types' => ['PE'],
        'service_location' => 'onsite',
    ]);
    $employee = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);
    $child = app(BulkAppointmentEnrollmentService::class)->enroll($event, $employee);
    $child->update(['status' => 'completed']);

    $otherCompany = Company::create(['company_name' => 'Private Other Company', 'status' => 'active']);
    $outsider = User::factory()->create(['role' => 'patient', 'company_id' => $otherCompany->id]);
    Appointment::create([
        'user_id' => $outsider->id,
        'company_id' => $otherCompany->id,
        'appointment_date' => today(),
        'type' => 'company_referral',
        'status' => 'completed',
        'service_types' => ['CBC'],
    ]);

    $this->actingAs($account)->get(route('appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('appointments/index')
            ->where('isCompanyView', true)
            ->has('appointments.data', 1)
            ->where('appointments.data.0.id', $child->id)
            ->where('appointments.data.0.status', 'completed'));

    $this->actingAs($account)->get(route('appointments.show', $child))->assertForbidden();
});
