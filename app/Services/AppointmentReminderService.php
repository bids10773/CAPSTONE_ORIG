<?php

namespace App\Services;

use App\Models\Appointment;
use App\Notifications\AppointmentReminder;
use Illuminate\Validation\ValidationException;

class AppointmentReminderService
{
    public function send(Appointment $appointment, bool $allowResend = false): bool
    {
        $appointment->loadMissing(['user', 'doctor']);

        if (! $this->isEligible($appointment)) {
            throw ValidationException::withMessages([
                'appointment' => 'Only accepted upcoming patient appointments can receive reminders.',
            ]);
        }

        if (! $allowResend && $appointment->reminder_sent_at !== null) {
            return false;
        }

        $appointment->user->notify(new AppointmentReminder($appointment));
        $appointment->forceFill(['reminder_sent_at' => now()])->save();

        return true;
    }

    public function sendDue(): int
    {
        $sent = 0;

        Appointment::query()
            ->where('type', 'individual')
            ->where('status', 'accepted')
            ->whereDate('appointment_date', today()->addDay())
            ->whereNull('reminder_sent_at')
            ->whereHas('user', fn ($query) => $query
                ->where('role', 'patient')
                ->whereNotNull('email'))
            ->orderBy('id')
            ->eachById(function (Appointment $appointment) use (&$sent): void {
                if ($this->send($appointment)) {
                    $sent++;
                }
            });

        return $sent;
    }

    private function isEligible(Appointment $appointment): bool
    {
        return $appointment->type === 'individual'
            && $appointment->status === 'accepted'
            && $appointment->appointment_date->startOfDay()->greaterThanOrEqualTo(today())
            && $appointment->user?->role === 'patient'
            && filled($appointment->user?->email);
    }
}
