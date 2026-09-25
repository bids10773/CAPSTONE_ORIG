<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\OnsiteEventStaff;
use App\Models\User;
use App\Services\BulkAppointmentEnrollmentService;
use App\Services\LaboratoryFormDefinition;
use Inertia\Testing\AssertableInertia as Assert;

function createBulkApprovalAssignments(array $staffCounts): array
{
    return collect($staffCounts)->flatMap(fn (int $count, string $role) => User::factory()
        ->count($count)
        ->create(['role' => $role, 'is_active' => true])
        ->map(fn (User $staff) => [
            'user_id' => $staff->id,
            'service_role' => $role,
        ]))->values()->all();
}

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
    $date = today()->nextWeekday();

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
        'event_contact_name' => $representative->name,
        'event_contact_number' => $representative->contact,
    ]);
});

test('company bulk appointments always use annual examination while selected services remain available', function () {
    $company = Company::create([
        'company_name' => 'Optional Services Company',
        'status' => 'active',
        'is_partnered' => true,
    ]);
    $account = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);

    $this->actingAs($account)->post(route('appointments.store'), [
        'appointment_date' => today()->nextWeekday()->toDateString(),
        'service_types' => ['PE'],
        'examination_purpose' => 'pre_employment',
        'service_location' => 'clinic', 'event_contact_name' => 'Ana Cruz',
        'event_contact_number' => '09171234567', 'expected_employee_count' => 100,
    ])->assertSessionDoesntHaveErrors();

    $standard = Appointment::query()->latest('id')->firstOrFail();
    expect($standard->examination_purpose)->toBe('annual_pe')
        ->and($standard->service_types)->toBe(['PE']);

    $this->actingAs($account)->post(route('appointments.store'), [
        'appointment_date' => today()->nextWeekday()->addWeekday()->toDateString(),
        'service_types' => ['PE', 'Drug Test', 'Pregnancy Test'],
        'examination_purpose' => 'pre_employment',
        'service_location' => 'clinic', 'event_contact_name' => 'Ana Cruz',
        'event_contact_number' => '09171234567', 'expected_employee_count' => 100,
    ])->assertSessionDoesntHaveErrors();

    $withAddOns = Appointment::query()->latest('id')->firstOrFail();
    expect($withAddOns->examination_purpose)->toBe('annual_pe')
        ->and(array_keys(app(LaboratoryFormDefinition::class)->sectionsFor($withAddOns)))
        ->toBe(['drug_test', 'pregnancy']);
});

test('the clinic decides whether a company bulk appointment needs one or two full days', function () {
    $company = Company::create([
        'company_name' => 'Two Day Program Company',
        'status' => 'active',
        'is_partnered' => true,
    ]);
    $account = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $startDate = today()->next('Monday');

    $this->actingAs($account)->post(route('appointments.store'), [
        'appointment_date' => $startDate->toDateString(),
        // Company input is intentionally ignored; the clinic decides at approval.
        'event_duration_days' => 2,
        'service_types' => ['PE', 'CBC'],
        'service_location' => 'onsite',
        'event_address' => 'Company Main Office',
        'event_contact_name' => 'Ana Cruz',
        'event_contact_number' => '09171234567',
        'expected_employee_count' => 150,
    ])->assertSessionDoesntHaveErrors();

    $appointment = Appointment::query()->latest('id')->firstOrFail();
    $employee = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);
    $employeeAppointment = app(BulkAppointmentEnrollmentService::class)->enroll($appointment, $employee);

    expect($appointment->appointment_date->toDateString())->toBe($startDate->toDateString())
        ->and($appointment->event_end_date)->toBeNull()
        ->and($employeeAppointment->event_end_date)->toBeNull()
        ->and($appointment->doctor_id)->toBeNull()
        ->and($appointment->start_time->format('H:i'))->toBe('08:00')
        ->and($appointment->end_time->format('H:i'))->toBe('17:00');

    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin)
        ->patch(route('admin.appointments.update-status', $appointment), [
            'status' => 'accepted',
            'event_duration_days' => 2,
            'staff_assignments' => createBulkApprovalAssignments([
                'doctor' => 3,
                'medtech' => 2,
                'receptionist' => 1,
            ]),
        ])
        ->assertSessionDoesntHaveErrors();

    expect($appointment->refresh()->event_end_date->toDateString())
        ->toBe($startDate->copy()->addDay()->toDateString())
        ->and($employeeAppointment->refresh()->event_end_date->toDateString())
        ->toBe($startDate->copy()->addDay()->toDateString())
        ->and($appointment->onsiteStaff()->where('is_active', true)->count())
        ->toBe(6);
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
        'start_time' => '08:00',
        'end_time' => '17:00',
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
        ->patch(route('admin.appointments.update-status', $bulk), [
            'status' => 'accepted',
            'event_duration_days' => 1,
            'staff_assignments' => createBulkApprovalAssignments(['doctor' => 1]),
        ])
        ->assertSessionHasErrors('staff_assignments');

    expect($bulk->refresh()->status)->toBe('pending')
        ->and($bulk->event_end_date)->toBeNull()
        ->and($bulk->onsiteStaff()->count())->toBe(0);

    $this->actingAs($admin)
        ->patch(route('admin.appointments.update-status', $bulk), [
            'status' => 'accepted',
            'event_duration_days' => 1,
            'staff_assignments' => createBulkApprovalAssignments([
                'doctor' => 1,
                'receptionist' => 1,
            ]),
        ])
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
    $this->actingAs($admin)->patch(route('admin.appointments.update-status', $draft), [
        'status' => 'accepted',
        'event_duration_days' => 1,
    ])
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

    $assignedStaff = collect(['doctor', 'receptionist', 'medtech', 'radtech'])
        ->mapWithKeys(fn (string $role) => [$role => User::factory()->create(['role' => $role])]);

    $assignedStaff->each(fn (User $staff, string $role) => OnsiteEventStaff::create([
        'bulk_appointment_id' => $parent->id,
        'user_id' => $staff->id,
        'service_role' => $role,
        'queue_capacity' => 10,
        'is_active' => true,
    ]));

    $this->actingAs($admin)->get(route('admin.bulk-appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('appointments.data', 1)
            ->where('appointments.data.0.id', $parent->id)
            ->where('appointments.data.0.bulk_employees_count', 1)
            ->has('appointments.data.0.onsite_staff', 4)
            ->where('appointments.data.0.onsite_staff', fn ($deployments) => collect($deployments)
                ->pluck('service_role')
                ->sort()
                ->values()
                ->all() === ['doctor', 'medtech', 'radtech', 'receptionist']
                && collect($deployments)->every(fn ($deployment) => data_get($deployment, 'user.id') === $assignedStaff[data_get($deployment, 'service_role')]->id)));

    $this->actingAs($admin)->get(route('admin.onsite-events.show', $parent))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/onsite-events/show')
            ->where('attendance.total', 1)
            ->has('employees.data', 1)
            ->where('employees.data.0.user.id', $employee->id));
});

test('individual appointments require complete patient details before receptionist approval', function () {
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $patient = User::factory()->create(['contact' => null]);
    $appointmentDate = today()->nextWeekday();
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

    $this->actingAs($receptionist)
        ->patch(route('receptionist.appointment-requests.approve', $appointment))
        ->assertSessionHasErrors('profile');

    expect($appointment->refresh()->status)->toBe('pending');

    $patient->update(['contact' => '09123456789']);
    $patient->patientProfile()->create([
        'birthdate' => '1990-01-01',
        'sex' => 'Male',
        'civil_status' => 'Single',
    ]);

    $this->actingAs($receptionist)
        ->patch(route('receptionist.appointment-requests.approve', $appointment))
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
        'start_time' => '08:00',
        'end_time' => '17:00',
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
        ->patch(route('admin.appointments.update-status', $parent), [
            'status' => 'accepted',
            'event_duration_days' => 1,
            'staff_assignments' => createBulkApprovalAssignments([
                'doctor' => 1,
                'medtech' => 1,
                'radtech' => 1,
                'receptionist' => 1,
            ]),
        ])
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
