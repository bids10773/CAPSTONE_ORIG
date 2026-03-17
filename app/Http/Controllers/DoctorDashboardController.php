<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorDashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $doctor = $request->user();

        $pendingCount = $doctor->doctorAppointments()->where('status', 'pending')->count();
        $todayCount = $doctor->doctorAppointments()
            ->whereIn('status', ['accepted', 'arrived'])
            ->whereDate('appointment_date', today())
            ->count();
        $totalPatients = $doctor->doctorAppointments()->with('user')->distinct('user_id')->count('user_id');
        $availabilityDays = count(array_filter($doctor->availability ?? []));

        return Inertia::render('doctor/dashboard', [
            'pendingCount' => $pendingCount,
            'todayCount' => $todayCount,
            'totalPatients' => $totalPatients,
            'availabilityDays' => $availabilityDays,
            'user' => $doctor,
        ]);
    }
}

