<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\User;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewAppointmentRequest extends Notification
{
    use Queueable;

    private readonly string $message;

    public function __construct(private readonly Appointment $appointment, User|int|null $actor = null)
    {
        $label = NotificationWording::actor($actor ?? $appointment->user);
        $this->message = ($label ? $label.' requested ' : 'A request was submitted for ').NotificationWording::appointment($appointment).' for '.NotificationWording::person($appointment->user, 'the patient').' on '.NotificationWording::schedule($appointment).'.';
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $appointment = $this->appointment->loadMissing('user');
        $url = $notifiable->role === 'receptionist'
            ? route('receptionist.appointment-requests.index', ['status' => 'pending'], false)
            : route('admin.appointments.index', ['status' => 'pending', 'type' => 'individual'], false);

        return [
            'type' => 'appointment_request',
            'title' => 'Appointment request received',
            'message' => $this->message,
            'appointment_id' => $appointment->id,
            'url' => $url,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appointment = $this->appointment->loadMissing('user');
        $url = $notifiable->role === 'receptionist'
            ? route('receptionist.appointment-requests.index', ['status' => 'pending'])
            : route('admin.appointments.index', ['status' => 'pending', 'type' => 'individual']);

        return (new MailMessage)
            ->subject('New appointment request awaiting review')
            ->greeting('New individual appointment request')
            ->line($this->message)
            ->line('The requested slot is reserved until the request is approved or rejected.')
            ->action('Review request', $url);
    }
}
