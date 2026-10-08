<?php

namespace App\Http\Controllers;

use App\Http\Requests\PatientVisitForecastRequest;
use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use App\Services\PatientVisitForecastService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class PatientVisitForecastController extends Controller
{
    public function __construct(private readonly PatientVisitForecastService $service) {}

    public function index(PatientVisitForecastRequest $request): Response
    {
        $filters = $request->validated();

        return Inertia::render('admin/patient-visits/index', [
            'initialData' => $this->analyticsData($filters),
        ]);
    }

    public function dashboard(PatientVisitForecastRequest $request): JsonResponse
    {
        $filters = $request->validated();

        return response()->json($this->analyticsData($filters));
    }

    /** @param array<string, mixed> $filters */
    private function analyticsData(array $filters): array
    {
        $data = $this->service->dashboard(
            $filters['start_date'] ?? null,
            $filters['end_date'] ?? null,
            (int) ($filters['daily_horizon'] ?? 14),
            (int) ($filters['monthly_horizon'] ?? 6),
        );

        $serviceBreakdown = Appointment::query()
            ->get(['service_types'])
            ->flatMap(fn (Appointment $appointment) => $appointment->service_types ?? [])
            ->filter()
            ->countBy()
            ->sortDesc()
            ->all();

        $data['overview'] = [
            'total_appointments' => Appointment::count(),
            'today_appointments' => Appointment::whereDate('appointment_date', Carbon::today())->count(),
            'active_companies' => Company::where('status', 'active')->count(),
            'service_type_count' => count($serviceBreakdown),
            'status_breakdown' => Appointment::query()
                ->selectRaw('status, COUNT(*) as aggregate')
                ->groupBy('status')
                ->pluck('aggregate', 'status')
                ->map(fn ($count) => (int) $count)
                ->all(),
            'service_type_breakdown' => $serviceBreakdown,
            'staff_by_role' => User::query()
                ->whereIn('role', ['doctor', 'medtech', 'radtech', 'receptionist', 'admin'])
                ->selectRaw('role, COUNT(*) as aggregate')
                ->groupBy('role')
                ->pluck('aggregate', 'role')
                ->map(fn ($count) => (int) $count)
                ->all(),
        ];

        return $data;
    }
}
