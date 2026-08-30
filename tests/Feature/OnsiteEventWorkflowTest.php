<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\OnsiteServiceQueue;
use App\Models\SecurityAudit;
use App\Models\User;
use App\Services\BulkAppointmentEnrollmentService;
use App\Services\OnsiteEventWorkflowService;

function onsiteFixture(): array
{
    $company = Company::create(['company_name' => 'Onsite Factory']);
    $representative = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $event = Appointment::create(['user_id' => $representative->id, 'company_id' => $company->id, 'appointment_date' => today(), 'start_time' => '08:00', 'end_time' => '17:00', 'type' => 'company_bulk', 'status' => 'accepted', 'service_types' => ['PE', 'CBC', 'X-Ray'], 'service_location' => 'onsite']);
    $employee = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);
    $child = app(BulkAppointmentEnrollmentService::class)->enroll($event, $employee);

    return compact('company', 'event', 'employee', 'child');
}

test('only arrived onsite employees enter independent medical queues', function () {
    extract(onsiteFixture());
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $medtech = User::factory()->create(['role' => 'medtech', 'is_active' => true]);
    $radtech = User::factory()->create(['role' => 'radtech', 'is_active' => true]);
    $workflow = app(OnsiteEventWorkflowService::class);
    $workflow->assignStaff($event, $doctor, 'doctor', 10);
    $workflow->assignStaff($event, $medtech, 'medtech', 10);
    $workflow->assignStaff($event, $radtech, 'radtech', 10);

    expect($child->attendance_status)->toBe('not_arrived')->and($child->serviceQueues()->count())->toBe(0);
    $workflow->markArrived($child, $receptionist);
    expect($child->refresh()->attendance_status)->toBe('arrived')
        ->and($child->serviceQueues()->pluck('service_role')->sort()->values()->all())->toBe(['doctor', 'medtech', 'radtech'])
        ->and($child->serviceQueues()->where('status', 'assigned')->count())->toBe(3);
});

test('absent employees leave all queues and resolve the parent event', function () {
    extract(onsiteFixture());
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $workflow = app(OnsiteEventWorkflowService::class);
    $workflow->markArrived($child, $receptionist);
    $workflow->markAbsent($child, $receptionist, 'no_show', null);
    expect($child->refresh()->status)->toBe('absent')->and($child->attendance_status)->toBe('absent')
        ->and(OnsiteServiceQueue::where('appointment_id', $child->id)->whereNotIn('status', ['removed', 'completed'])->count())->toBe(0)
        ->and($event->refresh()->status)->toBe('completed');
});

test('queue balancing assigns to the least loaded deployed staff without exceeding capacity', function () {
    extract(onsiteFixture());
    $doctorA = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $doctorB = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $workflow = app(OnsiteEventWorkflowService::class);
    $workflow->assignStaff($event, $doctorA, 'doctor', 1);
    $workflow->assignStaff($event, $doctorB, 'doctor', 1);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $workflow->markArrived($child, $receptionist);
    $secondUser = User::factory()->create(['role' => 'patient', 'company_id' => $company->id]);
    $second = app(BulkAppointmentEnrollmentService::class)->enroll($event, $secondUser);
    $workflow->markArrived($second, $receptionist);
    expect($child->serviceQueues()->where('service_role', 'doctor')->value('assigned_staff_id'))
        ->not->toBe($second->serviceQueues()->where('service_role', 'doctor')->value('assigned_staff_id'));
});

test('attendance is restricted to the receptionist assigned to the selected event', function () {
    extract(onsiteFixture());
    $admin = User::factory()->create(['role' => 'admin']);
    $assigned = User::factory()->create(['role' => 'receptionist', 'is_active' => true]);
    $other = User::factory()->create(['role' => 'receptionist', 'is_active' => true]);
    app(OnsiteEventWorkflowService::class)->assignStaff($event, $assigned, 'receptionist', 10, $admin);

    $this->actingAs($admin)->patch("/receptionist/onsite-employees/{$child->id}/attendance", ['attendance_status' => 'arrived'])->assertForbidden();
    $this->actingAs($other)->get(route('receptionist.onsite-events.show', $event))->assertForbidden();
    $this->actingAs($assigned)->patch(route('receptionist.onsite-employees.attendance', $child), ['attendance_status' => 'arrived'])->assertRedirect();

    expect($child->refresh()->attendance_status)->toBe('arrived')
        ->and(SecurityAudit::where('action', 'onsite_employee_marked_arrived')->where('actor_id', $assigned->id)->exists())->toBeTrue();
});

test('receptionist employee search is scoped to one bulk event and supports employee number', function () {
    extract(onsiteFixture());
    $admin = User::factory()->create(['role' => 'admin']);
    $receptionist = User::factory()->create(['role' => 'receptionist', 'is_active' => true]);
    app(OnsiteEventWorkflowService::class)->assignStaff($event, $receptionist, 'receptionist', 10, $admin);
    $employee->patientProfile()->create(['employee_number' => 'EVENT-A-001', 'birthdate' => '1990-01-01', 'sex' => 'male', 'civil_status' => 'Single']);

    $otherCompany = Company::create(['company_name' => 'Other Company']);
    $otherRepresentative = User::factory()->create(['role' => 'company', 'company_id' => $otherCompany->id]);
    $otherEvent = Appointment::create(['user_id' => $otherRepresentative->id, 'company_id' => $otherCompany->id, 'appointment_date' => today(), 'start_time' => '08:00', 'end_time' => '17:00', 'type' => 'company_bulk', 'status' => 'accepted', 'service_types' => ['PE'], 'service_location' => 'onsite']);
    $outsider = User::factory()->create(['role' => 'patient', 'company_id' => $otherCompany->id]);
    $outsider->patientProfile()->create(['employee_number' => 'EVENT-B-999', 'birthdate' => '1990-01-01', 'sex' => 'female', 'civil_status' => 'Single']);
    app(BulkAppointmentEnrollmentService::class)->enroll($otherEvent, $outsider);

    $this->actingAs($receptionist)->get(route('receptionist.onsite-events.show', ['event' => $event, 'search' => 'EVENT-A-001']))
        ->assertInertia(fn ($page) => $page->component('receptionist/onsite-events/attendance')->has('employees.data', 1));
    $this->actingAs($receptionist)->get(route('receptionist.onsite-events.show', ['event' => $event, 'search' => 'EVENT-B-999']))
        ->assertInertia(fn ($page) => $page->has('employees.data', 0));
});

test('staffing recommendations scale with employee count and required services', function () {
    extract(onsiteFixture());
    $event->update(['expected_employee_count' => 500]);
    config()->set('onsite.staffing_ratios', ['doctor' => 2, 'medtech' => 3, 'radtech' => 4, 'receptionist' => 5]);
    for ($i = 0; $i < 9; $i++) {
        app(BulkAppointmentEnrollmentService::class)->enroll($event, User::factory()->create(['role' => 'patient', 'company_id' => $company->id]));
    }

    $result = app(\App\Services\OnsiteStaffingRecommendationService::class)->for($event);
    expect($result['doctor']['recommended'])->toBe(5)
        ->and($result['doctor']['capacity_per_staff'])->toBe(2)
        ->and($result['medtech']['recommended'])->toBe(4)
        ->and($result['medtech']['capacity_per_staff'])->toBe(3)
        ->and($result['radtech']['recommended'])->toBe(3)
        ->and($result['radtech']['capacity_per_staff'])->toBe(4)
        ->and($result['receptionist']['recommended'])->toBe(1)
        ->and($result['receptionist']['scales_with_masterlist'])->toBeFalse()
        ->and($result['receptionist']['capacity_per_staff'])->toBeNull();
});

test('staffing recommendations do not fall back to an estimate without a masterlist', function () {
    extract(onsiteFixture());
    $child->delete();
    $event->update(['expected_employee_count' => 500]);

    $result = app(\App\Services\OnsiteStaffingRecommendationService::class)->for($event);

    expect($result['doctor']['recommended'])->toBe(0)
        ->and($result['medtech']['recommended'])->toBe(0)
        ->and($result['radtech']['recommended'])->toBe(0)
        ->and($result['receptionist']['recommended'])->toBe(0);
});

test('admin staff assignment derives clinical queue capacity from the uploaded masterlist', function () {
    extract(onsiteFixture());
    config()->set('onsite.staffing_ratios.doctor', 10);
    for ($i = 0; $i < 20; $i++) {
        app(BulkAppointmentEnrollmentService::class)->enroll(
            $event,
            User::factory()->create(['role' => 'patient', 'company_id' => $company->id]),
        );
    }
    $admin = User::factory()->create(['role' => 'admin']);
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);

    $this->actingAs($admin)->post(route('admin.onsite-events.staff.assign', $event), [
        'user_id' => $doctor->id,
        'service_role' => 'doctor',
    ])->assertRedirect();

    expect($event->onsiteStaff()->where('user_id', $doctor->id)->value('queue_capacity'))
        ->toBe(7)
        ->and($doctor->notifications()->where('data->type', 'onsite_staff_assigned')->count())
        ->toBe(1)
        ->and($doctor->unreadNotifications()->first()->data['url'])
        ->toBe(route('doctor.onsite-events.show', $event, false));
});

test('opening assigned onsite work marks the queue in progress and protects the deployment', function () {
    extract(onsiteFixture());
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $workflow = app(OnsiteEventWorkflowService::class);
    $deployment = $workflow->assignStaff($event, $doctor, 'doctor', 10);
    $workflow->markArrived($child, $receptionist);

    $workflow->startService($child, 'doctor', $doctor);

    expect($child->serviceQueues()->where('service_role', 'doctor')->value('status'))->toBe('in_progress')
        ->and($child->serviceQueues()->where('service_role', 'doctor')->value('started_at'))->not->toBeNull();
    expect(fn () => $workflow->removeStaff($event, $deployment))
        ->toThrow(\Illuminate\Validation\ValidationException::class);
});

test('only one department can process an onsite employee at a time', function () {
    extract(onsiteFixture());
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $medtech = User::factory()->create(['role' => 'medtech', 'is_active' => true]);
    $radtech = User::factory()->create(['role' => 'radtech', 'is_active' => true]);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $workflow = app(OnsiteEventWorkflowService::class);
    $workflow->assignStaff($event, $doctor, 'doctor', 10);
    $workflow->assignStaff($event, $medtech, 'medtech', 10);
    $workflow->assignStaff($event, $radtech, 'radtech', 10);
    $workflow->markArrived($child, $receptionist);

    $workflow->startService($child, 'doctor', $doctor);

    expect(fn () => $workflow->startService($child, 'medtech', $medtech))
        ->toThrow(\Illuminate\Validation\ValidationException::class)
        ->and(fn () => $workflow->startService($child, 'radtech', $radtech))
        ->toThrow(\Illuminate\Validation\ValidationException::class);

    $workflow->completeService($child, 'doctor', $doctor);
    $workflow->startService($child, 'medtech', $medtech);

    expect($child->serviceQueues()->where('service_role', 'medtech')->value('status'))
        ->toBe('in_progress');
});

test('doctor follow-up tasks use doctor deployments and are independently authorized', function () {
    extract(onsiteFixture());
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $otherDoctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $workflow = app(OnsiteEventWorkflowService::class);
    $workflow->assignStaff($event, $doctor, 'doctor', 10);
    $workflow->markArrived($child, $receptionist);
    $workflow->completeService($child, 'doctor', $doctor);

    $task = $workflow->createDoctorTask($child, 'final_evaluation');

    expect($task->service_role)->toBe('final_evaluation')
        ->and($task->assigned_staff_id)->toBe($doctor->id)
        ->and($doctor->can('finalizeMedicalEvaluation', $child->fresh()))->toBeTrue()
        ->and($otherDoctor->can('finalizeMedicalEvaluation', $child->fresh()))->toBeFalse();
});

test('bulk employees stay out of regular dashboards and remain available in onsite events', function () {
    extract(onsiteFixture());
    $medtech = User::factory()->create(['role' => 'medtech', 'is_active' => true]);
    $radtech = User::factory()->create(['role' => 'radtech', 'is_active' => true]);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $workflow = app(OnsiteEventWorkflowService::class);
    $workflow->assignStaff($event, $medtech, 'medtech', 10);
    $workflow->assignStaff($event, $radtech, 'radtech', 10);
    $workflow->markArrived($child, $receptionist);

    expect($child->fresh()->status)->toBe('arrived');
    $this->actingAs($medtech)->get(route('medtech.dashboard'))
        ->assertInertia(fn ($page) => $page->component('medtech/dashboard')
            ->where('pendingTests', 0)
            ->has('pendingAppointments', 0));
    $this->actingAs($radtech)->get(route('radtech.dashboard'))
        ->assertInertia(fn ($page) => $page->component('radtech/dashboard')
            ->where('pendingScans', 0)
            ->has('pendingAppointments', 0));
    $this->actingAs($medtech)->get(route('medtech.onsite-events.show', $event))
        ->assertInertia(fn ($page) => $page->has('queues.data', 1));
    $this->actingAs($radtech)->get(route('radtech.onsite-events.show', $event))
        ->assertInertia(fn ($page) => $page->has('queues.data', 1));
});

test('clinical staff have dedicated onsite event pages scoped to their own assignments', function () {
    extract(onsiteFixture());
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $medtech = User::factory()->create(['role' => 'medtech', 'is_active' => true]);
    $radtech = User::factory()->create(['role' => 'radtech', 'is_active' => true]);
    $otherDoctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $workflow = app(OnsiteEventWorkflowService::class);
    foreach ([[$doctor, 'doctor'], [$medtech, 'medtech'], [$radtech, 'radtech']] as [$staff, $role]) {
        $workflow->assignStaff($event, $staff, $role, 10);
    }
    $workflow->markArrived($child, $receptionist);

    foreach ([[$doctor, 'doctor'], [$medtech, 'medtech'], [$radtech, 'radtech']] as [$staff, $role]) {
        $this->actingAs($staff)->get(route("{$role}.appointments"))
            ->assertInertia(fn ($page) => $page->has('appointments.data', 0));
        $this->actingAs($staff)->get(route("{$role}.onsite-events.index"))
            ->assertInertia(fn ($page) => $page->component('staff/onsite-events/index')->has('events.data', 1));
        $this->actingAs($staff)->get(route("{$role}.onsite-events.show", $event))
            ->assertInertia(fn ($page) => $page->component('staff/onsite-events/show')->has('queues.data', 1));
    }

    $this->actingAs($otherDoctor)->get(route('doctor.onsite-events.show', $event))->assertForbidden();
});

test('admin can complete onsite activities without medically completing pending employees', function () {
    extract(onsiteFixture());
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->patch(route('admin.onsite-events.activities.complete', $event))
        ->assertRedirect()->assertSessionHas('success');

    expect($event->fresh()->onsite_event_status)->toBe('activities_completed')
        ->and($event->status)->toBe('accepted')
        ->and($child->fresh()->status)->not->toBe('completed')
        ->and(SecurityAudit::where('action', 'onsite_activities_completed')->where('actor_id', $admin->id)->exists())->toBeTrue();
});

test('onsite xray is verified and finalized by the assigned radtech', function () {
    extract(onsiteFixture());
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $radtech = User::factory()->create(['role' => 'radtech', 'is_active' => true]);
    $workflow = app(OnsiteEventWorkflowService::class);
    $workflow->assignStaff($event, $radtech, 'radtech', 10);
    $workflow->markArrived($child, $receptionist);

    $this->actingAs($radtech)->post(route('radtech.xrays.store', $child), [
        'workflow_action' => 'complete',
        'chest_status' => 'findings',
        'chest_findings' => 'Images acquired onsite.',
        'impression' => 'No acute findings.',
    ])->assertRedirect(route('radtech.onsite-events.show', $event))
        ->assertSessionHas('success');

    expect($child->fresh()->status)->not->toBe('verifying_xray')
        ->and($child->xrayReport()->count())->toBe(1)
        ->and($child->xrayReport->verified_by)->toBe($radtech->id)
        ->and($child->xrayReport->verified_at)->not->toBeNull()
        ->and($child->serviceQueues()->where('service_role', 'radtech')->value('status'))->toBe('completed')
        ->and($child->serviceQueues()->where('service_role', 'xray_verification')->exists())->toBeFalse();
});

test('onsite laboratory work returns the medtech to the company onsite event', function () {
    extract(onsiteFixture());
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $medtech = User::factory()->create(['role' => 'medtech', 'is_active' => true]);
    $workflow = app(OnsiteEventWorkflowService::class);
    $workflow->assignStaff($event, $medtech, 'medtech', 10);
    $workflow->markArrived($child, $receptionist);

    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $child), [
        'finalize' => false,
        'results' => [],
    ])->assertRedirect(route('medtech.onsite-events.show', $event))
        ->assertSessionHas('success');
});

test('onsite physical examination returns the doctor to the company onsite event', function () {
    extract(onsiteFixture());
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
    $workflow = app(OnsiteEventWorkflowService::class);
    $workflow->assignStaff($event, $doctor, 'doctor', 10);
    $workflow->markArrived($child, $receptionist);

    $payload = [
        'height' => 170, 'weight' => 65, 'blood_pressure' => '120/80',
        'pulse_rate' => 72, 'respiration_rate' => 16, 'temperature' => 36.7,
        'visual_acuity' => '20/20 OU', 'hearing' => 'Normal bilateral',
    ];
    foreach (['head_scalp', 'eyes', 'ears', 'nose_sinuses', 'mouth_throat', 'neck_thyroid', 'chest_breast', 'lungs', 'heart', 'abdomen', 'back', 'anus', 'genitals', 'extremities', 'skin', 'dental'] as $part) {
        $payload["{$part}_status"] = 'normal';
        $payload[$part] = null;
    }

    $this->actingAs($doctor)->post(route('doctor.physical-exams.store', $child), $payload)
        ->assertRedirect(route('doctor.onsite-events.show', $event))
        ->assertSessionHas('success');
});

test('parent event reaches results completed independently through child resolution', function () {
    extract(onsiteFixture());
    $child->update(['status' => 'completed']);

    expect($event->fresh()->status)->toBe('completed')
        ->and($event->fresh()->onsite_event_status)->toBe('results_completed');
});
