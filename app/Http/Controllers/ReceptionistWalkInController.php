<?php

namespace App\Http\Controllers;

use App\Http\Requests\SearchPatientsRequest;
use App\Http\Requests\StoreWalkInRequest;
use App\Http\Requests\UpdateWalkInStatusRequest;
use App\Models\Appointment;
use App\Models\User;
use App\Services\AppointmentSchedulingService;
use App\Services\WalkInService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReceptionistWalkInController extends Controller
{
    public function __construct(
        private readonly WalkInService $walkIns,
        private readonly AppointmentSchedulingService $scheduling,
    ) {}

    public function index(Request $request): Response
    {
        return $this->renderIndex($request, 'queue');
    }

    public function queue(Request $request): Response
    {
        return $this->renderIndex($request, 'queue');
    }

    public function patients(Request $request): Response
    {
        return $this->renderIndex($request, 'patients');
    }

    private function renderIndex(Request $request, string $mode): Response
    {
        abort_unless($request->user()->can('walkin.view'), 403);

        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();
        $queuePositions = Appointment::query()
            ->whereIn('type', ['individual', 'company_referral', 'company_bulk', 'walk_in'])
            ->whereHas('user', fn ($query) => $query->where('role', 'patient'))
            ->whereDate('appointment_date', today())
            ->orderByRaw("CASE WHEN type <> 'walk_in' AND arrived_at IS NOT NULL THEN 1 WHEN type <> 'walk_in' THEN 2 WHEN type = 'walk_in' THEN 3 ELSE 4 END")
            ->orderByRaw('COALESCE(start_time, arrived_at, created_at)')
            ->orderBy('id')
            ->get(['id', 'type'])
            ->groupBy(fn (Appointment $appointment): string => $appointment->type === 'walk_in' ? 'walk_in' : 'online')
            ->map(fn ($appointments) => $appointments->pluck('id')->flip());

        $walkIns = Appointment::query()
            ->with('user.patientProfile')
            ->whereIn('type', ['individual', 'company_referral', 'company_bulk', 'walk_in'])
            ->whereHas('user', fn ($query) => $query->where('role', 'patient'))
            ->whereDate('appointment_date', today())
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($search !== '', fn ($query) => $query->whereHas('user', fn ($patient) => $patient
                ->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->orderByRaw("CASE WHEN type <> 'walk_in' AND arrived_at IS NOT NULL THEN 1 WHEN type <> 'walk_in' AND status IN ('pending', 'accepted') THEN 2 WHEN type = 'walk_in' THEN 3 ELSE 4 END")
            ->orderByRaw('COALESCE(start_time, arrived_at, created_at)')
            ->orderBy('id')
            ->paginate($this->perPage($request))
            ->withQueryString()
            ->through(function (Appointment $appointment) use ($queuePositions): Appointment {
                $group = $appointment->type === 'walk_in' ? 'walk_in' : 'online';
                $position = ((int) $queuePositions->get($group, collect())->get($appointment->id)) + 1;
                $prefix = $group === 'walk_in' ? 'W' : 'O';
                $appointment->setAttribute('queue_number', $prefix.'-'.str_pad((string) $position, 3, '0', STR_PAD_LEFT));
                $appointment->setAttribute('arrival_status', $this->scheduling->arrivalStatus($appointment));
                $appointment->setAttribute('grace_ends_at', $this->scheduling->graceEndsAt($appointment)?->toIso8601String());

                return $appointment;
            });

        return Inertia::render('receptionist/walk-ins', [
            'walkIns' => $walkIns,
            'serviceTypes' => Appointment::getServiceTypeOptions(),
            'filters' => compact('status', 'search'),
            'mode' => $mode,
        ]);
    }

    public function store(StoreWalkInRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $existing = null;
        if ($data['patient_type'] === 'existing') {
            $existing = Appointment::query()
                ->where('user_id', $data['user_id'])
                ->whereIn('type', ['individual', 'company_referral'])
                ->whereDate('appointment_date', today())
                ->open()
                ->orderBy('start_time')
                ->first();
        }

        $appointment = $this->walkIns->create($data, $request->user());
        $position = Appointment::query()
            ->where('type', 'walk_in')
            ->whereDate('appointment_date', today())
            ->where('id', '<=', $appointment->id)
            ->count();

        $response = back()->with('success', 'Walk-in registered. Queue number: W-'.str_pad((string) $position, 3, '0', STR_PAD_LEFT).'.');
        if ($existing !== null) {
            $time = $existing->start_time?->format('g:i A') ?? 'a scheduled time';
            $response->with('warning', "Existing Appointment Found: This patient already has an online appointment today at {$time}. The walk-in was recorded under the current clinic policy.");
        }

        return $response;
    }

    public function updateStatus(UpdateWalkInStatusRequest $request, Appointment $appointment): RedirectResponse
    {
        if ($request->validated('status') === 'arrived') {
            $this->scheduling->checkIn($appointment, $request->user());
        } else {
            $appointment->update($request->validated());
        }

        return back()->with('success', 'Walk-in status updated.');
    }

    public function searchPatients(SearchPatientsRequest $request): JsonResponse
    {
        $search = $request->validated('q');

        $patients = User::query()
            ->where('role', 'patient')
            ->where('is_active', true)
            ->where(fn ($query) => $query
                ->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('contact', 'like', "%{$search}%"))
            ->orderBy('last_name')
            ->limit(10)
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'email', 'contact']);

        return response()->json($patients);
    }
}
