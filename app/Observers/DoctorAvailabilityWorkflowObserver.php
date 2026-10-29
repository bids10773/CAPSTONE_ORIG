<?php

namespace App\Observers;

use App\Models\DoctorAvailabilityChangeRequest;
use App\Models\User;
use App\Services\WorkflowNotificationService;

class DoctorAvailabilityWorkflowObserver
{
    public function __construct(private readonly WorkflowNotificationService $notifications) {}

    public function updated(DoctorAvailabilityChangeRequest $request): void
    {
        if (! $request->wasChanged('status') || $request->status === 'pending') {
            return;
        }
        $message = "Your availability change request was {$request->status}.";
        $this->notifications->users(User::whereKey($request->doctor_id)->where('role', 'doctor')->get(), 'doctor_availability_decision', 'Availability request reviewed', $message, route('doctor.doctor-availability.index', absolute: false));
        $this->notifications->admins('doctor_availability_reviewed', 'Availability request reviewed', "Availability request #{$request->id} was {$request->status}.", route('admin.doctor-availability.index', absolute: false));
    }
}
