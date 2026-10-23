<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DiagnosticResult;
use App\Services\OnsiteDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MedTechDashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, OnsiteDashboardService $onsiteDashboard): Response
    {
        $user = $request->user();
        $staffQueue = fn () => Appointment::query()->where(function ($query) {
            $query->where('type', '!=', 'company_bulk');
        });
        $actionableQueue = fn () => Appointment::query()->where(function ($query) {
            $query->where('type', '!=', 'company_bulk')->whereIn('status', ['for_diagnostics', 'verifying_drug_test']);
        });

        // ✅ Completed Tests (after final evaluation)
        $today = today()->toDateString();
        $queueCounts = $staffQueue()
            ->selectRaw("SUM(CASE WHEN status = 'completed' AND DATE(updated_at) = ? THEN 1 ELSE 0 END) as completed", [$today])
            ->selectRaw("SUM(CASE WHEN status IN ('for_diagnostics', 'verifying_drug_test') THEN 1 ELSE 0 END) as pending")
            ->selectRaw("SUM(CASE WHEN status IN ('for_diagnostics', 'verifying_drug_test') AND DATE(appointment_date) = ? THEN 1 ELSE 0 END) as today_actionable", [$today])
            ->selectRaw('SUM(CASE WHEN DATE(appointment_date) = ? THEN 1 ELSE 0 END) as today_total', [$today])
            ->first();

        $completedTests = (int) $queueCounts->completed;

        // ✅ Pending Tests (waiting for lab)
        $pendingTests = (int) $queueCounts->pending;

        $todayCount = (int) $queueCounts->today_actionable;

        // Upcoming Lab Tests
        $pendingAppointments = $actionableQueue()->with('user')
            ->orderBy('appointment_date')
            ->take(5)
            ->get();

        // 📊 Lab Capacity (example: percentage of active workload)
        $totalToday = (int) $queueCounts->today_total;
        $labCapacity = $totalToday > 0
            ? round(($pendingTests / $totalToday) * 100).'%'
            : '0%';

        return Inertia::render('medtech/dashboard', [
            'user' => $user,
            'completedTests' => $completedTests,
            'pendingTests' => $pendingTests,
            'pendingAppointments' => $pendingAppointments,
            'labCapacity' => $labCapacity,
            'todayCount' => $todayCount,
            'workflowCounts' => DiagnosticResult::query()
                ->whereHas('appointment', fn ($appointment) => $appointment->where('type', '!=', 'company_bulk'))
                ->where('service_key', '!=', 'drug_test')
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
            'drugTestProcessing' => DiagnosticResult::query()
                ->whereHas('appointment', fn ($appointment) => $appointment->where('type', '!=', 'company_bulk'))
                ->where('service_key', 'drug_test')
                ->whereIn('status', ['in_progress', 'awaiting_official_result', 'official_result_received'])
                ->count(),
            'onsiteSummary' => $onsiteDashboard->summaryFor($user),
        ]);
    }
}
