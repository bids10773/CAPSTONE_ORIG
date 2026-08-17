<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Http\Request;

class AppointmentAbuseMonitor
{
    public function recordBlocked(User $user, string $action, Request $request, array $metadata = []): void
    {
        SecurityAudit::create([
            'actor_id' => $user->id,
            'target_user_id' => $user->id,
            'action' => $action,
            'status' => 'blocked',
            'metadata' => [...$metadata, 'ip_address' => $request->ip()],
        ]);

        $threshold = (int) config('medical.booking_security.blocked_attempt_threshold', 5);
        $since = now()->subMinutes((int) config('medical.booking_security.blocked_attempt_window_minutes', 30));
        $count = SecurityAudit::query()
            ->where('target_user_id', $user->id)
            ->whereIn('action', ['same_date_booking_blocked', 'future_limit_reached'])
            ->where('created_at', '>=', $since)
            ->count();

        if ($count >= $threshold && ! SecurityAudit::query()
            ->where('target_user_id', $user->id)
            ->where('action', 'rapid_booking_attempts')
            ->where('created_at', '>=', $since)
            ->exists()) {
            SecurityAudit::create([
                'actor_id' => $user->id,
                'target_user_id' => $user->id,
                'action' => 'rapid_booking_attempts',
                'status' => 'review',
                'metadata' => ['blocked_attempts' => $count, 'window_minutes' => now()->diffInMinutes($since)],
            ]);
        }
    }

    public function recordCancellationIfUnusual(Appointment $appointment): void
    {
        if ($appointment->user_id === null || $appointment->type !== 'individual') {
            return;
        }

        $days = (int) config('medical.booking_security.cancellation_window_days', 30);
        $threshold = (int) config('medical.booking_security.cancellation_threshold', 3);
        $since = now()->subDays($days);
        $count = Appointment::query()
            ->where('user_id', $appointment->user_id)
            ->where('type', 'individual')
            ->where('status', 'cancelled')
            ->where('updated_at', '>=', $since)
            ->count();

        if ($count >= $threshold && ! SecurityAudit::query()
            ->where('target_user_id', $appointment->user_id)
            ->where('action', 'repeated_cancellation')
            ->where('created_at', '>=', $since)
            ->exists()) {
            SecurityAudit::create([
                'actor_id' => auth()->id(),
                'target_user_id' => $appointment->user_id,
                'action' => 'repeated_cancellation',
                'status' => 'review',
                'metadata' => ['appointment_id' => $appointment->id, 'cancellations' => $count, 'window_days' => $days],
            ]);
        }
    }
}
