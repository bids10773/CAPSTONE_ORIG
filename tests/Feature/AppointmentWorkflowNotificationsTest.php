<?php

use App\Models\Appointment;
use App\Models\User;

test('administrator created individual appointments notify the patient and active receptionists once', function () {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $patient = User::factory()->create(['role' => 'patient', 'is_active' => true]);
    $receptionist = User::factory()->create(['role' => 'receptionist', 'is_active' => true]);
    $inactiveReceptionist = User::factory()->create(['role' => 'receptionist', 'is_active' => false]);
    $unrelatedPatient = User::factory()->create(['role' => 'patient', 'is_active' => true]);
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);

    $this->actingAs($admin)->post(route('admin.appointments.store'), [
        'patient_id' => $patient->id,
        'type' => 'individual',
        'appointment_date' => '2026-11-02',
        'service_type' => array_key_first(Appointment::getBookableServiceTypeOptions()),
    ])->assertSessionHasNoErrors()->assertRedirect(route('admin.appointments.index'));

    expect($admin->notifications()->where('data->type', 'appointment_created')->count())->toBe(1)
        ->and($receptionist->notifications()->where('data->type', 'appointment_review_requested')->count())->toBe(1)
        ->and($patient->notifications()->where('data->type', 'appointment_registered')->count())->toBe(1)
        ->and($inactiveReceptionist->notifications()->count())->toBe(0)
        ->and($unrelatedPatient->notifications()->count())->toBe(0)
        ->and($doctor->notifications()->count())->toBe(0);
    expect($receptionist->notifications()->first()->data['url'])
        ->toBe(route('receptionist.appointment-requests.index', ['status' => 'pending'], false))
        ->and($patient->notifications()->first()->data['url'])->toBe(route('appointments.index', absolute: false));
});

test('walk in assignment and rescheduling notify the admin patient and assigned doctor', function () {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $patient = User::factory()->create(['role' => 'patient', 'is_active' => true]);
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $unrelated = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $appointment = Appointment::create(['user_id' => $patient->id, 'type' => 'walk_in', 'status' => 'pending', 'appointment_date' => '2026-11-02', 'service_types' => ['CBC']]);
    $appointment->update(['doctor_id' => $doctor->id, 'start_time' => '09:00', 'end_time' => '09:30', 'status' => 'accepted']);

    expect($admin->notifications()->where('data->type', 'appointment_updated')->exists())->toBeTrue()
        ->and($doctor->notifications()->where('data->type', 'appointment_assignment_changed')->exists())->toBeTrue()
        ->and($patient->notifications()->where('data->type', 'appointment_schedule_changed')->exists())->toBeTrue()
        ->and($unrelated->notifications()->count())->toBe(0);
    $count = $admin->notifications()->count();
    $appointment->update(['notes' => 'Internal note']);
    expect($admin->notifications()->count())->toBe($count);
});

test('workflow notification does not survive a rolled back appointment change', function () {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    \Illuminate\Support\Facades\DB::beginTransaction();
    Appointment::create(['user_id' => User::factory()->create(['role' => 'patient'])->id, 'type' => 'walk_in', 'status' => 'pending', 'appointment_date' => '2026-11-02', 'service_types' => ['CBC']]);
    \Illuminate\Support\Facades\DB::rollBack();
    expect($admin->notifications()->count())->toBe(0);
});

test('onsite task handoffs notify only their assigned clinician and active administrators', function () {
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $other = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $patient = User::factory()->create(['role' => 'patient']);
    $event = Appointment::create(['user_id' => $patient->id, 'type' => 'company_bulk', 'status' => 'accepted', 'appointment_date' => '2026-11-02', 'service_types' => ['CBC']]);
    $employee = Appointment::create(['user_id' => $patient->id, 'bulk_appointment_id' => $event->id, 'type' => 'company_bulk', 'status' => 'arrived', 'appointment_date' => '2026-11-02', 'service_types' => ['CBC']]);
    $queue = \App\Models\OnsiteServiceQueue::create(['bulk_appointment_id' => $event->id, 'appointment_id' => $employee->id, 'service_role' => 'doctor', 'status' => 'waiting']);
    $queue->update(['assigned_staff_id' => $doctor->id, 'status' => 'assigned']);
    expect($doctor->notifications()->where('data->type', 'onsite_task_assigned')->count())->toBe(1)
        ->and($other->notifications()->count())->toBe(0)
        ->and($admin->notifications()->where('data->type', 'onsite_queue_updated')->count())->toBe(1);
    $queue->update(['status' => 'assigned']);
    expect($doctor->notifications()->where('data->type', 'onsite_task_assigned')->count())->toBe(1);
});

test('availability decisions notify the requesting doctor without unrelated doctors', function () {
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $other = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $request = \App\Models\DoctorAvailabilityChangeRequest::create(['doctor_id' => $doctor->id, 'status' => 'pending', 'current_availability' => [], 'requested_availability' => []]);
    $request->update(['status' => 'rejected']);
    expect($doctor->notifications()->where('data->type', 'doctor_availability_decision')->count())->toBe(1)
        ->and($other->notifications()->count())->toBe(0);
});

test('company referral changes stay within the referral company and linked patient', function () {
    $company = \App\Models\Company::create(['company_name' => 'Company A', 'status' => 'active']);
    $otherCompany = \App\Models\Company::create(['company_name' => 'Company B', 'status' => 'active']);
    $account = User::factory()->create(['role' => 'company', 'company_id' => $company->id, 'is_active' => true]);
    $other = User::factory()->create(['role' => 'company', 'company_id' => $otherCompany->id, 'is_active' => true]);
    $patient = User::factory()->create(['role' => 'patient', 'is_active' => true]);
    $referral = \App\Models\CompanyReferral::create(['company_id' => $company->id, 'patient_id' => $patient->id, 'created_by' => $account->id, 'referral_number' => 'REF-TEST', 'invitation_token_hash' => hash('sha256', 'test-token'), 'employee_email' => $patient->email, 'first_name' => 'Test', 'last_name' => 'Patient', 'required_services' => ['CBC'], 'examination_purpose' => 'medical_clearance', 'valid_until' => today()->addDays(30), 'status' => 'sent']);
    $referral->update(['status' => 'cancelled']);
    expect($account->notifications()->where('data->type', 'company_referral_updated')->count())->toBe(2)
        ->and($patient->notifications()->where('data->type', 'company_referral_updated')->count())->toBe(2)
        ->and($other->notifications()->count())->toBe(0);
    expect(json_encode($account->notifications()->first()->data))->not->toContain('test-token');
});

test('obsolete clinical assignments do not notify users after their role changes', function () {
    $patient = User::factory()->create(['role' => 'patient', 'is_active' => true]);
    $formerDoctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $appointment = Appointment::create(['user_id' => $patient->id, 'doctor_id' => $formerDoctor->id, 'type' => 'individual', 'status' => 'accepted', 'appointment_date' => '2026-11-02', 'start_time' => '09:00', 'end_time' => '09:30', 'service_types' => ['CBC']]);
    $formerDoctor->update(['role' => 'patient']);
    $appointment->update(['start_time' => '10:00', 'end_time' => '10:30']);
    expect($formerDoctor->notifications()->where('data->type', 'appointment_assignment_changed')->count())->toBe(0);
    $appointment->update(['doctor_id' => null, 'status' => 'cancelled']);
    expect($formerDoctor->notifications()->where('data->type', 'appointment_assignment_removed')->count())->toBe(0);

    $event = Appointment::create(['user_id' => $patient->id, 'type' => 'company_bulk', 'status' => 'accepted', 'appointment_date' => '2026-11-02', 'service_types' => ['CBC']]);
    $queue = \App\Models\OnsiteServiceQueue::create(['bulk_appointment_id' => $event->id, 'appointment_id' => $appointment->id, 'service_role' => 'doctor', 'status' => 'waiting']);
    $queue->update(['assigned_staff_id' => $formerDoctor->id, 'status' => 'assigned']);
    expect($formerDoctor->notifications()->where('data->type', 'onsite_task_assigned')->count())->toBe(0);
});

test('bulk submission notifies once and cancellation alerts current deployed roles', function () {
    $company = \App\Models\Company::create(['company_name' => 'Bulk Company', 'status' => 'active']);
    $account = User::factory()->create(['role' => 'company', 'company_id' => $company->id, 'is_active' => true]);
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $formerDoctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $event = Appointment::create(['user_id' => $account->id, 'company_id' => $company->id, 'type' => 'company_bulk', 'status' => 'pending', 'onsite_event_status' => 'draft', 'appointment_date' => '2026-11-02', 'service_types' => ['CBC']]);
    $event->update(['onsite_event_status' => 'submitted']);
    $event->update(['onsite_event_status' => 'submitted']);
    expect($admin->notifications()->where('data->type', 'appointment_updated')->count())->toBe(1)
        ->and($account->notifications()->where('data->type', 'company_event_updated')->count())->toBe(1);
    foreach ([$doctor, $formerDoctor] as $staff) {
        \App\Models\OnsiteEventStaff::create(['bulk_appointment_id' => $event->id, 'user_id' => $staff->id, 'service_role' => 'doctor', 'queue_capacity' => 1, 'is_active' => true]);
    }
    $formerDoctor->update(['role' => 'patient']);
    app(\App\Services\BulkAppointmentEnrollmentService::class)->synchronizeParentStatus($event, 'cancelled');
    expect($doctor->notifications()->where('data->type', 'onsite_event_cancelled')->count())->toBe(1)
        ->and($formerDoctor->notifications()->where('data->type', 'onsite_event_cancelled')->count())->toBe(0);
});
