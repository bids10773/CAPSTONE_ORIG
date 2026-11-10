<?php

namespace App\Support;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Str;

final class NotificationWording
{
    public static function role(string $role): string
    {
        return match ($role) {
            'admin' => 'Administrator',
            'doctor', 'drug_verification', 'final_evaluation' => 'Doctor',
            'receptionist' => 'Receptionist',
            'medtech' => 'Medical Technologist',
            'radtech' => 'Radiologic Technologist',
            'company' => 'Company Representative',
            'patient' => 'Patient',
            default => Str::headline($role),
        };
    }

    public static function actor(User|int|null $actor): ?string
    {
        $user = is_int($actor) ? User::find($actor) : $actor;
        if (! $user || blank($user->name)) {
            return null;
        }

        return $user->name.' ('.self::role($user->role).')';
    }

    public static function service(string $service): string
    {
        return match ($service) {
            'doctor' => 'Physical examination',
            'medtech' => 'Laboratory',
            'radtech' => 'X-ray',
            'drug_verification' => 'Drug test verification',
            'final_evaluation' => 'Final evaluation',
            default => Str::headline($service),
        };
    }

    public static function by(User|int|null $actor): string
    {
        $label = self::actor($actor);

        return $label === null ? '' : ' by '.$label;
    }

    public static function person(?User $user, string $fallback = 'the affected user'): string
    {
        return $user && filled($user->name) ? $user->name : $fallback;
    }

    public static function appointment(Appointment $appointment): string
    {
        return 'appointment '.$appointment->reference_code;
    }

    public static function schedule(Appointment $appointment): string
    {
        // Appointment dates and time-only casts represent clinic-local wall time.
        $date = $appointment->appointment_date?->format('M j, Y') ?? 'a date to be confirmed';

        return $date.($appointment->start_time ? ' at '.$appointment->start_time->format('g:i A') : '');
    }

    public static function status(string $status): string
    {
        return match ($status) {
            'pending', 'pending_approval' => 'awaiting approval',
            'accepted' => 'confirmed',
            'arrived' => 'checked in',
            'for_physical_examination' => 'awaiting physical examination',
            'for_diagnostics' => 'awaiting laboratory tests',
            'for_xray' => 'awaiting X-ray',
            'awaiting_xray_result' => 'awaiting X-ray results',
            'verifying_xray' => 'awaiting X-ray verification',
            'verifying_drug_test' => 'awaiting drug test verification',
            'verifying_drug_and_xray' => 'awaiting drug test and X-ray verification',
            'for_final_evaluation' => 'awaiting final evaluation',
            'ready_for_pickup' => 'ready for pickup',
            'not_arrived' => 'not checked in',
            'changes_requested' => 'returned for correction',
            default => str_replace('_', ' ', $status),
        };
    }
}
