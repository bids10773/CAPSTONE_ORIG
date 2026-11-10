<?php

use App\Models\DoctorAvailabilityChangeRequest;
use App\Models\User;

test('availability review messages address only the reviewing administrator as you', function (string $status) {
    $reviewer = User::factory()->create([
        'first_name' => 'Ada', 'middle_name' => null, 'last_name' => 'Admin',
        'role' => 'admin', 'is_active' => true,
    ]);
    $otherAdmin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $doctor = User::factory()->create([
        'first_name' => 'Veronica', 'middle_name' => null, 'last_name' => 'Angeles',
        'role' => 'doctor', 'is_active' => true,
    ]);
    $this->actingAs($otherAdmin);
    $request = DoctorAvailabilityChangeRequest::create([
        'doctor_id' => $doctor->id, 'status' => 'pending',
        'current_availability' => [], 'requested_availability' => [],
    ]);

    $request->update(['status' => $status, 'reviewed_by' => $reviewer->id]);

    expect($reviewer->notifications()->where('data->type', 'doctor_availability_reviewed')->sole()->data['message'])
        ->toBe("You {$status} the availability request by Doctor Veronica Angeles.")
        ->and($otherAdmin->notifications()->where('data->type', 'doctor_availability_reviewed')->sole()->data['message'])
        ->toBe("Ada Admin (Administrator) {$status} the availability request by Doctor Veronica Angeles.")
        ->and($doctor->notifications()->where('data->type', 'doctor_availability_decision')->sole()->data['message'])
        ->toBe("Your availability change request #{$request->id} was {$status} by Ada Admin (Administrator).");
})->with(['rejected', 'accepted']);
