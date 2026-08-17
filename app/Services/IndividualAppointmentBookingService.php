<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\MedicalHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class IndividualAppointmentBookingService
{
    public function __construct(private readonly AppointmentAbuseMonitor $abuse) {}

    /** @param array<string, mixed> $data */
    public function create(User $user, array $data, Request $request): Appointment
    {
        $result = DB::transaction(function () use ($user, $data): Appointment|array {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();

            $user->loadMissing('patientProfile');
            if (blank($user->patientProfile?->birthdate) || blank($user->patientProfile?->sex) || blank($user->contact)) {
                throw ValidationException::withMessages([
                    'profile' => 'Complete your birthdate, sex, and contact number before requesting an appointment.',
                ]);
            }

            $sameDate = Appointment::query()
                ->where('user_id', $user->id)
                ->where('type', 'individual')
                ->whereDate('appointment_date', $data['appointment_date'])
                ->open()
                ->first();

            if ($sameDate !== null) {
                return [
                    'action' => 'same_date_booking_blocked',
                    'metadata' => ['appointment_id' => $sameDate->id, 'appointment_date' => $data['appointment_date']],
                    'messages' => ['appointment_date' => 'You already have an appointment scheduled for this date.'],
                ];
            }

            $futureCount = Appointment::query()
                ->where('user_id', $user->id)
                ->where('type', 'individual')
                ->whereDate('appointment_date', '>=', today())
                ->activeReservation()
                ->count();
            $limit = (int) config('medical.booking_security.max_active_future_appointments', 2);

            if ($futureCount >= $limit) {
                return [
                    'action' => 'future_limit_reached',
                    'metadata' => ['active_future_count' => $futureCount],
                    'messages' => ['appointment_limit' => 'You already have the maximum number of upcoming appointments. Please complete or cancel an existing appointment before scheduling another one.'],
                ];
            }

            $doctor = User::query()->whereKey($data['doctor_id'])->lockForUpdate()->firstOrFail();
            if ($doctor->role !== 'doctor' || ! $doctor->is_active) {
                throw ValidationException::withMessages(['doctor_id' => 'Invalid doctor selected.']);
            }

            $start = new \DateTime($data['appointment_date'].' '.$data['start_time']);
            $end = (clone $start)->add(new \DateInterval('PT30M'));
            $day = strtolower($start->format('D'));
            $withinAvailability = collect($doctor->availability ?? [])->where('day', $day)
                ->contains(fn ($period) => $start->format('H:i') >= $period['start'] && $end->format('H:i') <= $period['end']);
            if (! $withinAvailability) {
                throw ValidationException::withMessages(['start_time' => 'Selected time is outside the doctor\'s availability.']);
            }

            $overlap = Appointment::query()
                ->where('doctor_id', $doctor->id)
                ->whereDate('appointment_date', $data['appointment_date'])
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->where('start_time', '<', $end->format('H:i'))
                ->where('end_time', '>', $start->format('H:i'))
                ->lockForUpdate()
                ->exists();
            if ($overlap) {
                throw ValidationException::withMessages(['start_time' => 'Time slot already booked.']);
            }

            $appointment = Appointment::create([
                'user_id' => $user->id,
                'doctor_id' => $doctor->id,
                'start_time' => $start->format('H:i'),
                'end_time' => $end->format('H:i'),
                'appointment_date' => $data['appointment_date'],
                'type' => 'individual',
                'status' => 'pending',
                'service_types' => $data['service_types'],
                'notes' => $data['notes'] ?? null,
            ]);

            MedicalHistory::create([
                'appointment_id' => $appointment->id,
                ...collect($data)->only([
                    'present_illness', 'past_medical_history', 'operations_accidents',
                    'family_history', 'allergies', 'personal_social_history', 'ob_menstrual_history',
                ])->all(),
            ]);

            return $appointment;
        }, 3);

        if (is_array($result)) {
            $this->abuse->recordBlocked($user, $result['action'], $request, $result['metadata']);
            throw ValidationException::withMessages($result['messages']);
        }

        $admins = User::query()->where('role', 'admin')->where('is_active', true)->get();
        try {
            Notification::send($admins, new \App\Notifications\NewAppointmentRequest($result));
        } catch (\Throwable $exception) {
            Log::warning('Admin appointment request notification failed.', [
                'appointment_id' => $result->id,
                'exception' => $exception->getMessage(),
            ]);
        }
        try {
            $user->notify(new \App\Notifications\AppointmentSubmitted($result));
        } catch (\Throwable $exception) {
            Log::warning('Patient appointment submission notification failed.', [
                'appointment_id' => $result->id,
                'exception' => $exception->getMessage(),
            ]);
        }

        return $result;
    }
}
