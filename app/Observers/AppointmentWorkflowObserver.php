<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Models\User;
use App\Services\WorkflowNotificationService;
use App\Support\NotificationWording as W;

class AppointmentWorkflowObserver
{
    public function __construct(private readonly WorkflowNotificationService $notifications) {}

    public function created(Appointment $appointment): void
    {
        // Individual requests already have dedicated reviewer and patient notifications.
        if ($appointment->type === 'individual' || $appointment->bulk_appointment_id !== null) {
            return;
        }
        $this->notifications->admins('appointment_created', 'Appointment created', ucfirst(W::appointment($appointment)).' for '.($appointment->type === 'company_bulk' ? ($appointment->company?->company_name ?? 'the company') : W::person($appointment->user, 'the patient')).' was registered'.$this->by($appointment).'.', route('admin.appointments.show', $appointment, false));
        if ($appointment->type === 'walk_in') {
            $this->notifications->users(User::whereKey($appointment->user_id)->where('role', 'patient')->get(), 'walk_in_registered', 'Walk-in registered', 'Your walk-in '.W::appointment($appointment).' was registered'.$this->by($appointment).'.', route('appointments.index', absolute: false));
            if ($appointment->doctor_id) {
                $this->doctor($appointment, true);
            }
        }
        if ($appointment->type === 'company_referral') {
            $this->notifications->users(User::where('role', 'receptionist')->get(), 'referral_appointment_requested', 'Referral appointment requested', ucfirst(W::appointment($appointment)).' for '.W::person($appointment->user, 'the patient').' was submitted'.$this->by($appointment).' and is awaiting coordination.', route('receptionist.dashboard', absolute: false));
            $this->notifications->users(User::whereKey($appointment->user_id)->where('role', 'patient')->get(), 'referral_appointment_submitted', 'Appointment submitted', 'Your company referral '.W::appointment($appointment).' was submitted'.$this->by($appointment).'.', route('appointments.index', absolute: false));
        }
    }

    public function updated(Appointment $appointment): void
    {
        if (! $appointment->wasChanged(['status', 'doctor_id', 'appointment_date', 'start_time', 'end_time', 'attendance_status', 'onsite_event_status'])) {
            return;
        }
        $this->notifications->admins('appointment_updated', $this->updateTitle($appointment), $this->updateMessage($appointment), route('admin.appointments.show', $appointment, false));

        $scheduleChanged = $appointment->wasChanged(['doctor_id', 'appointment_date', 'start_time', 'end_time']);
        if ($scheduleChanged && $appointment->bulk_appointment_id === null) {
            $this->notifications->users(User::whereKey($appointment->user_id)->where('role', 'patient')->get(), 'appointment_schedule_changed', 'Appointment schedule updated', 'Your '.W::appointment($appointment).' was scheduled for '.W::schedule($appointment).$this->by($appointment).'.', route('appointments.index', absolute: false));
            if ($appointment->doctor_id) {
                $this->doctor($appointment);
            }
            $previous = $appointment->getOriginal('doctor_id');
            if ($previous && (int) $previous !== (int) $appointment->doctor_id) {
                $this->notifications->users(User::whereKey((int) $previous)->where('role', 'doctor')->get(), 'appointment_assignment_removed', 'Appointment reassigned', ucfirst(W::appointment($appointment)).' for '.W::person($appointment->user, 'the patient').' was reassigned from your queue'.$this->by($appointment).'.', route('doctor.appointments', absolute: false));
            }
        }
        if ($appointment->wasChanged('status') && in_array($appointment->status, ['cancelled', 'arrived'], true) && $appointment->bulk_appointment_id === null && $appointment->doctor_id) {
            $this->notifications->users(User::whereKey($appointment->doctor_id)->where('role', 'doctor')->get(), 'appointment_status_changed', 'Appointment status updated', ucfirst(W::appointment($appointment)).' for '.W::person($appointment->user, 'the patient').' was '.($appointment->status === 'arrived' ? 'checked in' : 'cancelled').$this->by($appointment).'.', route('doctor.appointments', absolute: false));
        }
        if ($appointment->isBulkParent() && $appointment->wasChanged(['status', 'onsite_event_status'])) {
            $this->bulkUpdated($appointment);
        }
    }

    public function bulkUpdated(Appointment $appointment, bool $automatic = false): void
    {
        $cancellationDetails = $appointment->status === 'cancelled' && filled($appointment->cancellation_reason)
            ? ' Reason: '.$appointment->cancellation_reason : '';
        if ($appointment->company_id !== null) {
            $this->notifications->users(User::where('role', 'company')->where('company_id', $appointment->company_id)->get(), 'company_event_updated', 'Company event '.($appointment->wasChanged('status') ? 'status updated' : 'stage updated'), $this->updateMessage($appointment, $automatic).$cancellationDetails, route('company.bulk-appointments.index', absolute: false));
        }
        if ($appointment->status === 'cancelled') {
            foreach ($appointment->onsiteStaff()->where('is_active', true)->with('user')->get() as $deployment) {
                $this->notifications->users(User::whereKey($deployment->user_id)->where('role', $deployment->service_role)->get(), 'onsite_event_cancelled', 'Onsite event cancelled', 'Your assigned company event '.$appointment->reference_code.' was cancelled'.($automatic ? ' by the system' : $this->by($appointment)).'.', route($deployment->service_role.'.onsite-events.index', absolute: false));
            }
        }
    }

    private function by(Appointment $appointment): string
    {
        return $appointment->notificationAutomaticallyUpdated ? ' by the system' : W::by(auth()->user());
    }

    private function updateTitle(Appointment $appointment): string
    {
        return match (true) {
            $appointment->wasChanged('status') => 'Appointment status updated',
            $appointment->wasChanged('onsite_event_status') => 'Company event stage updated',
            $appointment->wasChanged('attendance_status') => 'Appointment attendance updated',
            default => 'Appointment schedule updated',
        };
    }

    private function updateMessage(Appointment $appointment, bool $automatic = false): string
    {
        $reference = ucfirst(W::appointment($appointment)).' for '.($appointment->isBulkParent() ? ($appointment->company?->company_name ?? 'the company') : W::person($appointment->user, 'the patient'));
        $by = $automatic ? ' by the system' : $this->by($appointment);
        if ($appointment->wasChanged('status')) {
            return $reference.' status was changed to '.W::status($appointment->status).$by.'.';
        }
        if ($appointment->wasChanged('onsite_event_status')) {
            return $reference.' event stage was changed to '.W::status($appointment->onsite_event_status).$by.'.';
        }
        if ($appointment->wasChanged('attendance_status')) {
            return $reference.' attendance was changed to '.W::status($appointment->attendance_status ?? 'not recorded').$by.'.';
        }

        return $reference.' schedule was updated'.$by.' to '.W::schedule($appointment).'.';
    }

    private function doctor(Appointment $appointment, bool $created = false): void
    {
        $this->notifications->users(User::whereKey($appointment->doctor_id)->where('role', 'doctor')->get(), 'appointment_assignment_changed', ($created || $appointment->wasChanged('doctor_id') ? 'Appointment assigned' : 'Appointment rescheduled'), ucfirst(W::appointment($appointment)).' for '.W::person($appointment->user, 'the patient').($appointment->wasChanged('doctor_id') || $created ? ' was assigned to your queue' : ' was rescheduled in your queue').$this->by($appointment).' for '.W::schedule($appointment).'.', route('doctor.appointments', absolute: false));
    }
}
