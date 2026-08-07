<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RadTechDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        // ✅ Today's scans
        $todayScans = Appointment::whereIn('status', ['for_xray', 'awaiting_xray_result'])
            ->whereDate('appointment_date', today())
            ->count();

        // ✅ Pending scans (waiting for X-ray)
        $pendingScans = Appointment::whereIn('status', ['for_xray', 'awaiting_xray_result'])->count();

        // ✅ Completed scans (today)
        $completedScans = Appointment::where('status', 'completed')
            ->whereDate('updated_at', today())
            ->count();

        // ✅ Capacity (same idea as MedTech)
        $totalToday = Appointment::whereDate('appointment_date', today())->count();

        $pendingAppointments = Appointment::with('user')
            ->whereIn('status', ['for_xray', 'awaiting_xray_result'])
            ->orderBy('appointment_date')
            ->take(5)
            ->get();

        return Inertia::render('radtech/dashboard', [
            'user' => $user,
            'todayScans' => $todayScans,
            'pendingScans' => $pendingScans,
            'completedScans' => $completedScans,
            'pendingAppointments' => $pendingAppointments, // 👈 ADD THIS
        ]);
    }
}
