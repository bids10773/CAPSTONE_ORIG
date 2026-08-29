<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\XrayReport;
use App\Services\OnsiteDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RadTechDashboardController extends Controller
{
    public function __invoke(Request $request, OnsiteDashboardService $onsiteDashboard): Response
    {
        $user = $request->user();
        $staffQueue = fn () => Appointment::query()->where(function ($query) {
            $query->where('type', '!=', 'company_bulk');
        });
        $actionableQueue = fn () => Appointment::query()->where(function ($query) {
            $query->where('type', '!=', 'company_bulk')->whereIn('status', ['for_xray', 'awaiting_xray_result', 'verifying_xray']);
        });

        // ✅ Today's scans
        $todayScans = $actionableQueue()
            ->whereDate('appointment_date', today())
            ->count();

        // ✅ Pending scans (waiting for X-ray)
        $pendingScans = $actionableQueue()->count();

        // ✅ Completed scans (today)
        $completedScans = $staffQueue()->where('status', 'completed')
            ->whereDate('updated_at', today())
            ->count();

        // ✅ Capacity (same idea as MedTech)
        $totalToday = $staffQueue()->whereDate('appointment_date', today())->count();

        $pendingAppointments = $actionableQueue()->with('user')
            ->orderBy('appointment_date')
            ->take(5)
            ->get();

        return Inertia::render('radtech/dashboard', [
            'user' => $user,
            'todayScans' => $todayScans,
            'pendingScans' => $pendingScans,
            'completedScans' => $completedScans,
            'workflowCounts' => XrayReport::query()
                ->whereHas('appointment', fn ($appointment) => $appointment->where('type', '!=', 'company_bulk'))
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
            'activeStationCount' => XrayReport::query()
                ->whereHas('appointment', fn ($appointment) => $appointment->where('type', '!=', 'company_bulk'))
                ->whereNull('performed_at')->count(),
            'onsiteSummary' => $onsiteDashboard->summaryFor($user),
            'pendingAppointments' => $pendingAppointments, // 👈 ADD THIS
        ]);
    }
}
