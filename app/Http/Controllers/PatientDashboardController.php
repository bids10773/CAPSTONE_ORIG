<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PatientDashboardController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | 1. GUEST VIEW (PUBLIC LANDING PAGE)
        |--------------------------------------------------------------------------
        | If user is not logged in, show welcome/landing page
        */
        if (!$user) {
            return Inertia::render('welcome');
        }

        /*
        |--------------------------------------------------------------------------
        | 2. EMAIL VERIFICATION CHECK
        |--------------------------------------------------------------------------
        | Ensures only verified patients can access dashboard
        | (Admins/staff can bypass via your staff.verified middleware)
        */
        if (!$user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        /*
        |--------------------------------------------------------------------------
        | 3. FETCH PATIENT APPOINTMENT DATA
        |--------------------------------------------------------------------------
        | Optimized queries scoped to authenticated patient only
        */
        $appointments = Appointment::with('company')
            ->where('user_id', $user->id)
            ->latest('appointment_date')
            ->limit(10)
            ->get();

        $upcomingAppointments = Appointment::with('company')
            ->where('user_id', $user->id)
            ->whereDate('appointment_date', '>=', now())
            ->whereIn('status', [
                'pending',
                'accepted',
                'arrived',
                'for_diagnostics',
                'for_xray',
                'for_final_evaluation',
            ])
            ->orderBy('appointment_date', 'asc')
            ->limit(5)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | 4. DASHBOARD STATS (PATIENT METRICS)
        |--------------------------------------------------------------------------
        */
        $stats = [
            'total' => Appointment::where('user_id', $user->id)->count(),
            'completed' => Appointment::where('user_id', $user->id)
                ->where('status', 'completed')
                ->count(),
            'pending' => Appointment::where('user_id', $user->id)
                ->where('status', 'pending')
                ->count(),
            'accepted' => Appointment::where('user_id', $user->id)
                ->where('status', 'accepted')
                ->count(),
            'physical' => Appointment::where('user_id', $user->id)
                ->where('status', 'arrived')
                ->count(),
            'laboratory' => Appointment::where('user_id', $user->id)
                ->where('status', 'for_diagnostics')
                ->count(),
            'final_evaluation' => Appointment::where('user_id', $user->id)
                ->where('status', 'for_final_evaluation')
                ->count(),
        ];

        /*
        |--------------------------------------------------------------------------
        | 5. RETURN INERTIA RESPONSE
        |--------------------------------------------------------------------------
        */
        return Inertia::render('dashboard', [
            'auth' => [
                'user' => $user,
            ],
            'appointments' => $appointments,
            'upcomingAppointments' => $upcomingAppointments,
            'stats' => $stats,
        ]);
    }
}
