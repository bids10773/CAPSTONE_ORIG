<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\User;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentRejected extends Notification
{
    use Queueable;

    private readonly string $message;

    public function __construct(public readonly Appointment $appointment, User|int|null $actor = null)
    {
        $this->message = ($appointment->rejection_reason === 'schedule_expired' ? 'The system rejected your appointment request '.$appointment->reference_code.' for '.NotificationWording::schedule($appointment).' because the requested schedule expired before clinic approval.' : 'Your appointment request '.$appointment->reference_code.' for '.NotificationWording::schedule($appointment).' was rejected'.NotificationWording::by($actor ?? ($appointment->status === 'rejected' && $appointment->rejection_reason !== 'schedule_expired' ? $appointment->processed_by : null)).'.');
    }

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
            'title' => 'Appointment request rejected',
            'message' => $this->message.(filled((string) $reason) && $this->appointment->rejection_reason !== 'schedule_expired' ? ' Reason: '.$reason.'.' : ''),
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
            ->subject('Appointment request rejected | Living Myth Industrial Clinic')
            ->greeting('Appointment request rejected')
            ->line($this->message)
            ->when(filled((string) $reason) && $appointment->rejection_reason !== 'schedule_expired', fn (MailMessage $mail) => $mail->line('Reason: '.$reason))
            ->action('Book another appointment', route('appointment.create'));
    }
}
