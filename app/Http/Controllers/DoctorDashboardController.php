<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;


class DoctorDashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $doctor = $request->user();

$pendingCount = $doctor->doctorAppointments()
    ->whereIn('status', ['accepted', 'for_final_evaluation'])
    ->count();        $todayCount = $doctor->doctorAppointments()
            ->whereIn('status', ['accepted', 'arrived' , 'for_final_evaluation' ])
            ->whereDate('appointment_date', today())
            ->count();
        $totalPatients = $doctor->doctorAppointments()->with('user')->distinct('user_id')->count('user_id');
        $availabilityDays = count(array_filter($doctor->availability ?? []));

         // ✅ NEW: Completed Physical Exams
    $completedPhysicalCount = $doctor->doctorAppointments()
        ->where('status', 'completed')
        ->whereDate('updated_at', today()) // remove this if you want ALL completed
        ->count();

        $upcomingAppointments = $doctor->doctorAppointments()
    ->with('user')
    ->whereIn('status', ['accepted', 'arrived', 'for_final_evaluation'])
    ->where('appointment_date', '>=', Carbon::today()) // 👈 FIX
    ->orderBy('appointment_date', 'asc')
    ->take(5)
    ->get();

        return Inertia::render('doctor/dashboard', [
            'pendingCount' => $pendingCount,
            'todayCount' => $todayCount,
            'totalPatients' => $totalPatients,
            'completedPhysicalCount' => $completedPhysicalCount,
            'availabilityDays' => $availabilityDays,
            'upcomingAppointments' => $upcomingAppointments,
            'user' => $doctor,
        ]);
    }
}

