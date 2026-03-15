<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientDashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        
        // Get patient's recent appointments
        $appointments = Appointment::where('user_id', $user->id)
            ->with(['company'])
            ->orderBy('appointment_date', 'desc')
            ->limit(10)
            ->get();
        
        // Get upcoming appointments
        $upcomingAppointments = Appointment::where('user_id', $user->id)
            ->where('appointment_date', '>=', now())
            ->whereIn('status', ['pending', 'arrived'])
            ->orderBy('appointment_date', 'asc')
            ->limit(5)
            ->get();
        
        // Get completed appointments count
        $completedCount = Appointment::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();
        
        // Get pending appointments count
        $pendingCount = Appointment::where('user_id', $user->id)
            ->where('status', 'pending')
            ->count();
        
        return Inertia::render('dashboard', [
            'user' => $user,
            'appointments' => $appointments,
            'upcomingAppointments' => $upcomingAppointments,
            'stats' => [
                'total' => Appointment::where('user_id', $user->id)->count(),
                'completed' => $completedCount,
                'pending' => $pendingCount,
            ],
        ]);
    }
}

