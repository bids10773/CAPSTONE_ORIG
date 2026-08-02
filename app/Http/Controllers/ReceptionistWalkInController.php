<?php

namespace App\Http\Controllers;

use App\Http\Requests\SearchPatientsRequest;
use App\Http\Requests\StoreWalkInRequest;
use App\Http\Requests\UpdateWalkInStatusRequest;
use App\Models\Appointment;
use App\Models\User;
use App\Services\WalkInService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReceptionistWalkInController extends Controller
{
    public function __construct(private readonly WalkInService $walkIns) {}

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
            ->whereIn('type', ['individual', 'company_referral', 'walk_in'])
            ->whereDate('appointment_date', today())
            ->orderByRaw("CASE WHEN type = 'walk_in' THEN 2 ELSE 1 END")
            ->orderBy('start_time')
            ->orderBy('id')
            ->get(['id', 'type'])
            ->groupBy(fn (Appointment $appointment): string => $appointment->type === 'walk_in' ? 'walk_in' : 'online')
            ->map(fn ($appointments) => $appointments->pluck('id')->flip());

        $walkIns = Appointment::query()
            ->with('user.patientProfile')
            ->whereIn('type', ['individual', 'company_referral', 'walk_in'])
            ->whereDate('appointment_date', today())
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($search !== '', fn ($query) => $query->whereHas('user', fn ($patient) => $patient
                ->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->orderByRaw("CASE WHEN type = 'walk_in' THEN 2 ELSE 1 END")
            ->orderByRaw("CASE status WHEN 'arrived' THEN 1 WHEN 'accepted' THEN 2 WHEN 'pending' THEN 3 WHEN 'completed' THEN 4 ELSE 5 END")
            ->orderBy('start_time')
            ->orderBy('id')
            ->get()
            ->values()
            ->map(function (Appointment $appointment) use ($queuePositions): Appointment {
                $group = $appointment->type === 'walk_in' ? 'walk_in' : 'online';
                $position = ((int) $queuePositions->get($group, collect())->get($appointment->id)) + 1;
                $prefix = $group === 'walk_in' ? 'W' : 'O';
                $appointment->setAttribute('queue_number', $prefix.'-'.str_pad((string) $position, 3, '0', STR_PAD_LEFT));

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
        $appointment = $this->walkIns->create($request->validated());
        $position = Appointment::query()
            ->where('type', 'walk_in')
            ->whereDate('appointment_date', today())
            ->where('id', '<=', $appointment->id)
            ->count();

        return back()->with('success', 'Walk-in registered. Queue number: W-'.str_pad((string) $position, 3, '0', STR_PAD_LEFT).'.');
    }

    public function updateStatus(UpdateWalkInStatusRequest $request, Appointment $appointment): RedirectResponse
    {
        $appointment->update($request->validated());

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
