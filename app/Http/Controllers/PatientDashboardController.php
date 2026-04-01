<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
    $user = $request->user();

    // 1. If NO USER is logged in, show the Guest Page
    // This is NOT protected, so guests can see your animations/hero.
    if (!$user) {
        return Inertia::render('welcome'); 
    }
        
        // 1. Set default empty values
        $appointments = [];
        $upcomingAppointments = [];
        $stats = [
            'total' => 0,
            'completed' => 0,
            'pending' => 0,
        ];

        // 2. Only fetch data IF the user is logged in
        if ($user) {
            $appointments = Appointment::where('user_id', $user->id)
                ->with(['company'])
                ->orderBy('appointment_date', 'desc')
                ->limit(10)
                ->get();
            
            $upcomingAppointments = Appointment::where('user_id', $user->id)
                ->where('appointment_date', '>=', now())
                ->whereIn('status', ['pending', 'arrived'])
                ->orderBy('appointment_date', 'asc')
                ->limit(5)
                ->get();
            
            $stats = [
                'total' => Appointment::where('user_id', $user->id)->count(),
                'completed' => Appointment::where('user_id', $user->id)->where('status', 'completed')->count(),
                'pending' => Appointment::where('user_id', $user->id)->where('status', 'pending')->count(),
            ];
        }

        // 3. Return to Inertia
        return Inertia::render('dashboard', [
            'auth' => [
                'user' => $user, // Send the user (or null)
            ],
            // Move these outside 'auth' to keep your React props clean
            'appointments' => $appointments,
            'upcomingAppointments' => $upcomingAppointments,
            'stats' => $stats,
        ]);
    }
}