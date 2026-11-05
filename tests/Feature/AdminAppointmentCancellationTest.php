<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use App\Notifications\AppointmentCancelled;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Notification::fake();
    $this->admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $this->patient = User::factory()->create(['role' => 'patient']);
    $this->appointment = Appointment::create([
        'user_id' => $this->patient->id, 'type' => 'individual', 'status' => 'accepted',
        'appointment_date' => today()->addWeekday(), 'start_time' => '09:00', 'end_time' => '09:30',
        'service_types' => ['CBC'],
    ]);
});

test('admin cancellation requires a meaningful reason within the length limit', function ($reason) {
    $this->actingAs($this->admin)->patch(route('admin.appointments.update-status', $this->appointment), [
        'status' => 'cancelled', 'cancellation_reason' => $reason,
    ])->assertSessionHasErrors('cancellation_reason');

    expect($this->appointment->refresh()->status)->toBe('accepted');
    Notification::assertNotSentTo($this->patient, AppointmentCancelled::class);
})->with([null, '', '   ', str_repeat('a', 501)]);

test('admin cancellation saves the reason and includes it in patient notices', function () {
    $reason = 'Clinic equipment maintenance; please rebook.';
    $this->actingAs($this->admin)->patch(route('admin.appointments.update-status', $this->appointment), [
        'status' => 'cancelled', 'cancellation_reason' => '  '.$reason.'  ',
    ])->assertSessionHasNoErrors();

    expect($this->appointment->refresh()->status)->toBe('cancelled')
        ->and($this->appointment->cancellation_reason)->toBe($reason);
    Notification::assertSentTo($this->patient, AppointmentCancelled::class, function ($notice) use ($reason) {
        expect($notice->toDatabase($this->patient)['message'])->toContain($reason)
            ->and(implode(' ', $notice->toMail($this->patient)->introLines))->toContain($reason);

        return true;
    });
});

test('bulk cancellation retains the reason while cancelling employee participation', function () {
    $company = Company::create(['company_name' => 'Cancellation Test Company', 'status' => 'active']);
    $owner = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $parent = Appointment::create([
        'user_id' => $owner->id, 'company_id' => $company->id, 'type' => 'company_bulk',
        'status' => 'accepted', 'appointment_date' => today()->addWeekday(), 'service_types' => ['CBC'],
    ]);
    $this->patient->update(['company_id' => $company->id]);
    $child = app(\App\Services\BulkAppointmentEnrollmentService::class)->enroll($parent, $this->patient);
    $this->actingAs($this->admin)->patch(route('admin.appointments.update-status', $parent), [
        'status' => 'cancelled', 'cancellation_reason' => 'Company requested a new event date.',
    ])->assertSessionHasNoErrors();

    expect($parent->refresh()->status)->toBe('cancelled')
        ->and($parent->cancellation_reason)->toBe('Company requested a new event date.')
        ->and($child->refresh()->status)->toBe('absent')
        ->and($child->absence_reason)->toBe('event_cancelled');

    Notification::assertSentTo($owner, \App\Notifications\WorkflowActivity::class, function ($notice) use ($owner) {
        return str_contains($notice->toDatabase($owner)['message'], 'Company requested a new event date.');
    });
    $this->actingAs($owner)->get(route('company.bulk-appointments.index'))
        ->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
        ->where('appointments.data.0.cancellation_reason', 'Company requested a new event date.'));
});

test('other status changes do not require a cancellation reason', function () {
    $this->actingAs($this->admin)->patch(route('admin.appointments.update-status', $this->appointment), [
        'status' => 'arrived',
    ])->assertSessionHasNoErrors();
    expect($this->appointment->refresh()->status)->toBe('arrived');
});
