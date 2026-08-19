<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\OnsiteServiceQueue;
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
