<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentReminder extends Notification
{
    use Queueable;

    public function __construct(public readonly Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'appointment_reminder',
            'title' => 'Appointment Reminder',
            'message' => 'Reminder: your appointment is on '.$this->appointment->appointment_date->format('M j, Y').' at '.$this->appointment->start_time?->format('g:i A').'.',
            'appointment_id' => $this->appointment->id,
            'url' => route('appointments.show', $this->appointment, absolute: false),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appointment = $this->appointment;

        return (new MailMessage)
            ->subject('Appointment Reminder | Living Myth Industrial Clinic')
            ->greeting('Appointment Reminder')
            ->line('This is a reminder about your upcoming appointment at Living Myth Industrial Clinic.')
            ->line('Reference: '.$appointment->reference_code)
            ->line('Date: '.$appointment->appointment_date->format('F j, Y'))
            ->line('Time: '.($appointment->start_time?->format('g:i A') ?? 'Please contact the clinic'))
            ->line('Doctor: '.($appointment->doctor ? 'Dr. '.$appointment->doctor->name : 'To be assigned'))
            ->line('Please arrive 15 minutes before your scheduled time.')
            ->action('View Appointment', route('appointments.show', $appointment));
    }
}
