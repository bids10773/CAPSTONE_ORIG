<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Appointment;

class MedTechDashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
{
    $user = $request->user();

    // ✅ Completed Tests (after final evaluation)
    $completedTests = Appointment::where('status', 'completed')
    ->whereDate('updated_at', today()) // remove this if you want ALL completed
    ->count();

    // ✅ Pending Tests (waiting for lab)
    $pendingTests = Appointment::where('status', 'for_diagnostics')->count();

    $todayCount = Appointment::where('status', 'for_diagnostics')
    ->whereDate('appointment_date', today())
    ->count();

 //Upcoming Lab Tests
    $pendingAppointments = Appointment::with('user')
    ->where('status', 'for_diagnostics')
    ->orderBy('appointment_date')
    ->take(5)
    ->get();


    // 📊 Lab Capacity (example: percentage of active workload)
    $totalToday = Appointment::whereDate('appointment_date', today())->count();
    $labCapacity = $totalToday > 0 
        ? round(($pendingTests / $totalToday) * 100) . '%'
        : '0%';

    return Inertia::render('medtech/dashboard', [
        'user' => $user,
        'completedTests' => $completedTests,
        'pendingTests' => $pendingTests,
        'pendingAppointments' => $pendingAppointments,
        'labCapacity' => $labCapacity,
        'todayCount' => $todayCount,
    ]);
}
}

