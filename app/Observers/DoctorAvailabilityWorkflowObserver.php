<?php

namespace App\Observers;

use App\Models\DoctorAvailabilityChangeRequest;
use App\Models\User;
use App\Services\WorkflowNotificationService;
use App\Support\NotificationWording as W;

class DoctorAvailabilityWorkflowObserver
{
    public function __construct(private readonly WorkflowNotificationService $notifications) {}

    public function updated(DoctorAvailabilityChangeRequest $request): void
    {
        if (! $request->wasChanged('status') || $request->status === 'pending') {
            return;
        }
        $reviewer = $request->wasChanged('reviewed_by') ? $request->reviewer : auth()->user();
        $by = W::by($reviewer);
        $message = "Your availability change request #{$request->id} was {$request->status}{$by}.";
        $this->notifications->users(User::whereKey($request->doctor_id)->where('role', 'doctor')->get(), 'doctor_availability_decision', 'Availability request reviewed', $message, route('doctor.doctor-availability.index', absolute: false));

        $doctor = $request->doctor ? 'Doctor '.$request->doctor->name : 'the doctor';
        $actor = W::actor($reviewer);
        foreach (User::query()->where('role', 'admin')->where('is_active', true)->get() as $admin) {
            $message = $admin->is($reviewer)
                ? "You {$request->status} the availability request by {$doctor}."
                : ($actor
                    ? "{$actor} {$request->status} the availability request by {$doctor}."
                    : "The availability request by {$doctor} was {$request->status}.");

            $this->notifications->users([$admin], 'doctor_availability_reviewed', 'Availability request reviewed', $message, route('admin.doctor-availability.index', absolute: false));
        }
    }
}
