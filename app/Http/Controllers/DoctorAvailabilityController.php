<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorAvailabilityChangeRequest;
use App\Models\User;
use App\Services\DoctorAvailabilityChangeService;
use App\Support\SearchTerm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DoctorAvailabilityController extends Controller
{
    private const DAYS = ['mon' => 'Monday', 'tue' => 'Tuesday', 'wed' => 'Wednesday', 'thu' => 'Thursday', 'fri' => 'Friday'];

    public function adminIndex(Request $request): Response
    {
        $isAdmin = $request->user()->role === 'admin';
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'doctor_id' => ['nullable', 'integer'],
            'request_id' => ['nullable', 'integer'],
        ]);
        $search = SearchTerm::normalize((string) ($filters['search'] ?? ''));
        $likeSearch = SearchTerm::forLike($search);
        $status = (string) ($filters['status'] ?? '');
        $doctors = User::query()->where('role', 'doctor')
            ->when(! $isAdmin, fn ($q) => $q->whereKey($request->user()->id))
            ->when($isAdmin && $search !== '', fn ($q) => $q->where(fn ($inner) => $inner->where('first_name', 'like', "%{$likeSearch}%")->orWhere('last_name', 'like', "%{$likeSearch}%")->orWhere('specialization', 'like', "%{$likeSearch}%")))
            ->when($isAdmin && in_array($status, ['active', 'inactive'], true), fn ($q) => $q->where('is_active', $status === 'active'))
            ->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'specialization', 'availability', 'is_active'])
            ->each(fn (User $doctor) => $doctor->setAttribute(
                'availability',
                collect($doctor->availability ?? [])->whereIn('day', array_keys(self::DAYS))->values()->all(),
            ));
        $selected = $doctors->firstWhere('id', (int) ($filters['doctor_id'] ?? 0)) ?? $doctors->first();

        $pendingRequests = collect();
        if ($isAdmin) {
            $pendingRequests = DoctorAvailabilityChangeRequest::query()
                ->pending()
                ->with('doctor:id,first_name,middle_name,last_name,specialization,availability')
                ->latest()
                ->get();
        }
        $selectedRequest = $isAdmin
            ? $pendingRequests->firstWhere('id', (int) ($filters['request_id'] ?? 0))
                ?? $pendingRequests->firstWhere('doctor_id', $selected?->id)
            : DoctorAvailabilityChangeRequest::query()
                ->pending()
                ->where('doctor_id', $request->user()->id)
                ->latest()
                ->first();

        return Inertia::render('admin/doctor-availability/index', [
            'doctors' => $doctors, 'days' => self::DAYS, 'selectedDoctorId' => $selected?->id,
            'filters' => compact('search', 'status'), 'clinicHours' => config('medical.clinic_hours'), 'isAdmin' => $isAdmin,
            'pendingRequests' => $pendingRequests->map(fn (DoctorAvailabilityChangeRequest $change) => [
                'id' => $change->id,
                'doctor_id' => $change->doctor_id,
                'doctor' => $change->doctor,
                'created_at' => $change->created_at?->toIso8601String(),
            ])->values(),
            'selectedRequest' => $selectedRequest
                ? $this->serializeRequest($selectedRequest, app(DoctorAvailabilityChangeService::class))
                : null,
        ]);
    }

    public function doctorSubmit(Request $request, DoctorAvailabilityChangeService $changes): RedirectResponse
    {
        $validated = $request->validate($this->availabilityRules(includeDoctor: false));
        $periods = collect($validated['availability'] ?? [])->sortBy(fn ($period) => $period['day'].'-'.$period['start'])->values();
        $this->validatePeriods($periods);
        $changes->submit($request->user(), $periods->all());

        return back()->with('success', 'Your availability change was submitted for administrator review. Your current schedule remains active.');
    }

    public function adminUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->availabilityRules());
        $doctor = User::findOrFail($validated['doctor_id']);
        $periods = collect($validated['availability'] ?? [])->sortBy(fn ($p) => $p['day'].'-'.$p['start'])->values();
        $this->validatePeriods($periods);
        $this->validateFutureAppointments($doctor, $periods);
        $doctor->update(['availability' => $periods->all()]);

        return back()->with('success', $request->input('action') === 'clear' ? 'Doctor availability cleared successfully.' : "Dr. {$doctor->first_name} {$doctor->last_name}'s availability was updated successfully.");
    }

    public function approve(
        DoctorAvailabilityChangeRequest $availabilityChangeRequest,
        Request $request,
        DoctorAvailabilityChangeService $changes,
    ): RedirectResponse {
        $moved = $changes->approve($availabilityChangeRequest, $request->user());

        return back()->with('success', "Availability request accepted. {$moved} affected appointment(s) moved.");
    }

    public function reject(
        DoctorAvailabilityChangeRequest $availabilityChangeRequest,
        Request $request,
        DoctorAvailabilityChangeService $changes,
    ): RedirectResponse {
        $changes->reject($availabilityChangeRequest, $request->user());

        return back()->with('success', 'Availability request rejected. The current schedule and appointments were not changed.');
    }

    private function availabilityRules(bool $includeDoctor = true): array
    {
        $rules = [
            'availability' => ['nullable', 'array'],
            'availability.*.day' => ['required', Rule::in(array_keys(self::DAYS))],
            'availability.*.start' => ['required', 'date_format:H:i'],
            'availability.*.end' => ['required', 'date_format:H:i'],
            'action' => ['nullable', Rule::in(['save', 'clear'])],
        ];

        if ($includeDoctor) {
            $rules['doctor_id'] = ['required', Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'doctor'))];
        }

        return $rules;
    }

    private function serializeRequest(
        DoctorAvailabilityChangeRequest $changeRequest,
        DoctorAvailabilityChangeService $changes,
    ): array {
        $changeRequest->loadMissing('doctor:id,first_name,middle_name,last_name,specialization,availability');
        $affected = $changes->affectedAppointments(
            $changeRequest->doctor,
            collect($changeRequest->requested_availability),
        );

        return [
            'id' => $changeRequest->id,
            'status' => $changeRequest->status,
            'doctor_id' => $changeRequest->doctor_id,
            'doctor' => $changeRequest->doctor,
            'current_availability' => $changeRequest->doctor->availability ?? [],
            'requested_availability' => $changeRequest->requested_availability,
            'created_at' => $changeRequest->created_at?->toIso8601String(),
            'affected_appointments' => $affected->map(fn (Appointment $appointment) => [
                'id' => $appointment->id,
                'patient_name' => $appointment->user?->name,
                'appointment_date' => $appointment->appointment_date->toDateString(),
                'start_time' => $appointment->start_time?->format('H:i'),
                'end_time' => $appointment->end_time?->format('H:i'),
                'status' => $appointment->status,
            ])->values(),
        ];
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
        $appointments = Appointment::where('doctor_id', $doctor->id)->whereDate('appointment_date', '>=', today())->whereNotIn('status', ['cancelled', 'rejected', 'completed'])->get(['appointment_date', 'start_time', 'end_time']);
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
