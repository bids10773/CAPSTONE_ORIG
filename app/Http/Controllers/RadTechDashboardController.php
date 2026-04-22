<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Appointment;
use Carbon\Carbon;


class RadTechDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        // ✅ Today's scans
     $todayScans = Appointment::where('status', 'for_xray')
     ->whereDate('appointment_date' , today())
     ->count();

        // ✅ Pending scans (waiting for X-ray)
        $pendingScans = Appointment::where('status', 'for_xray')->count();

        // ✅ Completed scans (today)
        $completedScans = Appointment::where('status', 'completed')
            ->whereDate('updated_at', today())
            ->count();

        // ✅ Capacity (same idea as MedTech)
        $totalToday = Appointment::whereDate('appointment_date', today())->count();

        $pendingAppointments = Appointment::with('user')
    ->where('status', 'for_xray')
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