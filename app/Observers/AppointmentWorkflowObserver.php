<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Models\User;
use App\Services\WorkflowNotificationService;

class AppointmentWorkflowObserver
{
    public function __construct(private readonly WorkflowNotificationService $notifications) {}

    public function created(Appointment $appointment): void
    {
        // Individual requests already have dedicated reviewer and patient notifications.
        if ($appointment->type === 'individual' || $appointment->bulk_appointment_id !== null) {
            return;
        }
        $this->notifications->admins('appointment_created', 'Appointment created', "{$appointment->reference_code} was registered.", route('admin.appointments.show', $appointment, false));
        if ($appointment->type === 'walk_in') {
            $this->notifications->users(User::whereKey($appointment->user_id)->where('role', 'patient')->get(), 'walk_in_registered', 'Walk-in registered', 'Your clinic walk-in appointment has been registered.', route('appointments.index', absolute: false));
            if ($appointment->doctor_id) {
                $this->doctor($appointment);
            }
        }
        if ($appointment->type === 'company_referral') {
            $this->notifications->users(User::where('role', 'receptionist')->get(), 'referral_appointment_requested', 'Referral appointment requested', 'A company referral appointment is awaiting coordination.', route('receptionist.dashboard', absolute: false));
            $this->notifications->users(User::whereKey($appointment->user_id)->where('role', 'patient')->get(), 'referral_appointment_submitted', 'Appointment submitted', 'Your company referral appointment was submitted.', route('appointments.index', absolute: false));
        }
    }

    public function updated(Appointment $appointment): void
    {
        if (! $appointment->wasChanged(['status', 'doctor_id', 'appointment_date', 'start_time', 'end_time', 'attendance_status', 'onsite_event_status'])) {
            return;
        }
        $this->notifications->admins('appointment_updated', 'Appointment updated', "{$appointment->reference_code} has a workflow update. Status: {$appointment->status}.", route('admin.appointments.show', $appointment, false));

        $scheduleChanged = $appointment->wasChanged(['doctor_id', 'appointment_date', 'start_time', 'end_time']);
        if ($scheduleChanged && $appointment->bulk_appointment_id === null) {
            $this->notifications->users(User::whereKey($appointment->user_id)->where('role', 'patient')->get(), 'appointment_schedule_changed', 'Appointment schedule updated', 'Your appointment is scheduled for '.$appointment->appointment_date->format('M j, Y').' at '.($appointment->start_time?->format('g:i A') ?? 'a time to be confirmed').'.', route('appointments.index', absolute: false));
            if ($appointment->doctor_id) {
                $this->doctor($appointment);
            }
            $previous = $appointment->getOriginal('doctor_id');
            if ($previous && (int) $previous !== (int) $appointment->doctor_id) {
                $this->notifications->users(User::whereKey((int) $previous)->where('role', 'doctor')->get(), 'appointment_assignment_removed', 'Appointment reassigned', 'An appointment has been reassigned from your queue.', route('doctor.appointments', absolute: false));
            }
        }
        if ($appointment->wasChanged('status') && in_array($appointment->status, ['cancelled', 'arrived'], true) && $appointment->bulk_appointment_id === null && $appointment->doctor_id) {
            $this->notifications->users(User::whereKey($appointment->doctor_id)->where('role', 'doctor')->get(), 'appointment_status_changed', 'Appointment status updated', "{$appointment->reference_code} is now {$appointment->status}.", route('doctor.appointments', absolute: false));
        }
        if ($appointment->isBulkParent() && $appointment->wasChanged(['status', 'onsite_event_status'])) {
            $this->bulkUpdated($appointment);
        }
    }

    public function bulkUpdated(Appointment $appointment): void
    {
        if ($appointment->company_id !== null) {
            $this->notifications->users(User::where('role', 'company')->where('company_id', $appointment->company_id)->get(), 'company_event_updated', 'Company event updated', "{$appointment->reference_code} has been updated. Status: {$appointment->status}.", route('company.bulk-appointments.index', absolute: false));
        }
        if ($appointment->status === 'cancelled') {
            foreach ($appointment->onsiteStaff()->where('is_active', true)->with('user')->get() as $deployment) {
                $this->notifications->users(User::whereKey($deployment->user_id)->where('role', $deployment->service_role)->get(), 'onsite_event_cancelled', 'Onsite event cancelled', 'Your assigned company event has been cancelled.', route($deployment->service_role.'.onsite-events.index', absolute: false));
            }
        }
    }

    private function doctor(Appointment $appointment): void
    {
        $this->notifications->users(User::whereKey($appointment->doctor_id)->where('role', 'doctor')->get(), 'appointment_assignment_changed', 'Appointment assigned', "{$appointment->reference_code} has been assigned or rescheduled in your queue.", route('doctor.appointments', absolute: false));
    }
}
