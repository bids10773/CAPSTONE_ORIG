<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentRejected extends Notification
{
    use Queueable;

    public function __construct(public readonly Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $reason = $this->appointment->rejection_reason === 'other'
            ? $this->appointment->rejection_details
            : str($this->appointment->rejection_reason)->replace('_', ' ')->title();

        return [
            'type' => 'appointment_rejected',
            'title' => 'Appointment Request Rejected',
            'message' => 'Your appointment request for '.$this->appointment->appointment_date->format('M j, Y').' was not approved. Reason: '.$reason.'.',
            'appointment_id' => $this->appointment->id,
            'url' => route('appointments.index', absolute: false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appointment = $this->appointment;
        $reason = $appointment->rejection_reason === 'other'
            ? $appointment->rejection_details
            : str($appointment->rejection_reason)->replace('_', ' ')->title();

        return (new MailMessage)
            ->subject('Appointment Request Rejected | Living Myth Industrial Clinic')
            ->greeting('Appointment Request Rejected')
            ->line('Your appointment request for '.$appointment->appointment_date->format('F j, Y').' at '.$appointment->start_time?->format('g:i A').' was not approved.')
            ->line('Reason: '.$reason)
            ->action('Book Another Appointment', route('appointment.create'));
    }
}
