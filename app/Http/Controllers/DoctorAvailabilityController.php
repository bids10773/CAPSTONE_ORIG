<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DoctorAvailabilityController extends Controller
{
    private const DAYS = ['mon' => 'Monday', 'tue' => 'Tuesday', 'wed' => 'Wednesday', 'thu' => 'Thursday', 'fri' => 'Friday', 'sat' => 'Saturday', 'sun' => 'Sunday'];

    public function adminIndex(Request $request): Response
    {
        $isAdmin = $request->user()->role === 'admin';
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', '');
        $doctors = User::query()->where('role', 'doctor')
            ->when(! $isAdmin, fn ($q) => $q->whereKey($request->user()->id))
            ->when($isAdmin && $search !== '', fn ($q) => $q->where(fn ($inner) => $inner->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%")->orWhere('specialization', 'like', "%{$search}%")))
            ->when($isAdmin && in_array($status, ['active', 'inactive'], true), fn ($q) => $q->where('is_active', $status === 'active'))
            ->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'specialization', 'availability', 'is_active']);
        $selected = $doctors->firstWhere('id', (int) $request->query('doctor_id')) ?? $doctors->first();

        return Inertia::render('admin/doctor-availability/index', [
            'doctors' => $doctors, 'days' => self::DAYS, 'selectedDoctorId' => $selected?->id,
            'filters' => compact('search', 'status'), 'clinicHours' => config('medical.clinic_hours'), 'isAdmin' => $isAdmin,
        ]);
    }

    public function adminUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'doctor_id' => ['required', Rule::exists('users', 'id')->where(fn ($q) => $q->where('role', 'doctor'))],
            'availability' => ['nullable', 'array'],
            'availability.*.day' => ['required', Rule::in(array_keys(self::DAYS))],
            'availability.*.start' => ['required', 'date_format:H:i'],
            'availability.*.end' => ['required', 'date_format:H:i'],
            'action' => ['nullable', Rule::in(['save', 'clear'])],
        ]);
        $doctor = User::findOrFail($validated['doctor_id']);
        if ($request->user()->role !== 'admin' && $request->user()->id !== $doctor->id) {
            abort(403);
        }

        $periods = collect($validated['availability'] ?? [])->sortBy(fn ($p) => $p['day'].'-'.$p['start'])->values();
        $this->validatePeriods($periods);
        $this->validateFutureAppointments($doctor, $periods);
        $doctor->update(['availability' => $periods->all()]);

        return back()->with('success', $request->input('action') === 'clear' ? 'Doctor availability cleared successfully.' : "Dr. {$doctor->first_name} {$doctor->last_name}'s availability was updated successfully.");
    }

    private function validatePeriods(Collection $periods): void
    {
        $opens = config('medical.clinic_hours.opens_at', '08:00');
        $closes = config('medical.clinic_hours.closes_at', '17:00');
        foreach ($periods->groupBy('day') as $day => $items) {
            $previousEnd = null;
            foreach ($items->sortBy('start') as $period) {
                if ($period['start'] >= $period['end']) {
                    throw ValidationException::withMessages(['availability' => self::DAYS[$day].': end time must be after start time.']);
                }
                if ($period['start'] < $opens || $period['end'] > $closes) {
                    throw ValidationException::withMessages(['availability' => self::DAYS[$day].": periods must be within clinic hours ({$opens}–{$closes})."]);
                }
                if ($previousEnd !== null && $period['start'] < $previousEnd) {
                    throw ValidationException::withMessages(['availability' => self::DAYS[$day].': availability periods cannot overlap.']);
                }
                $previousEnd = $period['end'];
            }
        }
    }

    private function validateFutureAppointments(User $doctor, Collection $periods): void
    {
        $appointments = Appointment::where('doctor_id', $doctor->id)->whereDate('appointment_date', '>=', today())->whereNotIn('status', ['cancelled', 'completed'])->get(['appointment_date', 'start_time', 'end_time']);
        foreach ($appointments as $appointment) {
            $day = strtolower($appointment->appointment_date->format('D'));
            $start = substr((string) $appointment->start_time, 0, 5);
            $end = substr((string) $appointment->end_time, 0, 5);
            if (! $periods->where('day', $day)->contains(fn ($p) => $start >= $p['start'] && $end <= $p['end'])) {
                throw ValidationException::withMessages(['availability' => "The new schedule excludes an existing appointment on {$appointment->appointment_date->format('M j, Y')} at {$start}. Reschedule or cancel it first."]);
            }
        }
    }
}
