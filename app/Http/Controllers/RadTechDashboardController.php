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
        $today = today()->toDateString();
        $queueCounts = $staffQueue()
            ->selectRaw("SUM(CASE WHEN status IN ('for_xray', 'awaiting_xray_result', 'verifying_xray') AND DATE(appointment_date) = ? THEN 1 ELSE 0 END) as today_actionable", [$today])
            ->selectRaw("SUM(CASE WHEN status IN ('for_xray', 'awaiting_xray_result', 'verifying_xray') THEN 1 ELSE 0 END) as pending")
            ->selectRaw("SUM(CASE WHEN status = 'completed' AND DATE(updated_at) = ? THEN 1 ELSE 0 END) as completed", [$today])
            ->selectRaw('SUM(CASE WHEN DATE(appointment_date) = ? THEN 1 ELSE 0 END) as today_total', [$today])
            ->first();

        $todayScans = (int) $queueCounts->today_actionable;

        // ✅ Pending scans (waiting for X-ray)
        $pendingScans = (int) $queueCounts->pending;

        // ✅ Completed scans (today)
        $completedScans = (int) $queueCounts->completed;

        // ✅ Capacity (same idea as MedTech)
        $totalToday = (int) $queueCounts->today_total;

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
