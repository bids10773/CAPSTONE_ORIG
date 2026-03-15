<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use App\Models\Company;
use App\Models\Appointment;
use App\Models\LabResult;
use App\Models\PhysicalExam;
use App\Models\XrayReport;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        // Get date ranges
        $today = Carbon::today();
        $thisWeek = Carbon::now()->startOfWeek();
        $thisMonth = Carbon::now()->startOfMonth();
        
        // Get stats
        $stats = [
            'totalStaff' => User::whereIn('role', ['doctor', 'medtech', 'radtech'])->count(),
            'totalCompanies' => Company::count(),
            'totalPatients' => User::where('role', 'patient')->count(),
            'todayAppointments' => Appointment::whereDate('appointment_date', $today)->count(),
            'weekAppointments' => Appointment::where('appointment_date', '>=', $thisWeek)->count(),
            'monthAppointments' => Appointment::where('appointment_date', '>=', $thisMonth)->count(),
            'completedAppointments' => Appointment::where('status', 'completed')->count(),
            'pendingAppointments' => Appointment::where('status', 'pending')->count(),
            'totalLabResults' => LabResult::count(),
            'totalPhysicalExams' => PhysicalExam::count(),
            'totalXrayReports' => XrayReport::count(),
        ];
        
        // Get recent appointments
        $recentAppointments = Appointment::with(['user', 'company'])
            ->orderBy('appointment_date', 'desc')
            ->limit(10)
            ->get();
            
        // Get appointments by status for chart
        $appointmentsByStatus = Appointment::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();
            
        // Get appointments by type for chart
        $appointmentsByType = Appointment::selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->get()
            ->pluck('count', 'type')
            ->toArray();
            
        // Get monthly appointment trends (last 6 months)
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthlyTrends[] = [
                'month' => $month->format('M Y'),
                'count' => Appointment::whereYear('appointment_date', $month->year)
                    ->whereMonth('appointment_date', $month->month)
                    ->count()
            ];
        }

        return Inertia::render('admin/dashboard', [
            'user' => $request->user(),
            'stats' => $stats,
            'recentAppointments' => $recentAppointments,
            'appointmentsByStatus' => $appointmentsByStatus,
            'appointmentsByType' => $appointmentsByType,
            'monthlyTrends' => $monthlyTrends,
        ]);
    }

    /**
     * Analytics page for admin.
     */
    public function analytics(Request $request): Response
    {
        // Monthly appointment trends (last 12 months)
        $monthlyTrends = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthlyTrends[] = [
                'month' => $month->format('M Y'),
                'count' => Appointment::whereYear('appointment_date', $month->year)
                    ->whereMonth('appointment_date', $month->month)
                    ->count()
            ];
        }

        // Service type breakdown
        $serviceTypeBreakdown = Appointment::selectRaw('service_type, COUNT(*) as count')
            ->groupBy('service_type')
            ->get()
            ->pluck('count', 'service_type')
            ->toArray();

        // Company breakdown
        $companyAppointments = Appointment::with('company:id,company_name')
            ->whereNotNull('company_id')
            ->get()
            ->groupBy('company_id')
            ->map(function ($items, $companyId) {
                return [
                    'company_name' => $items->first()->company?->company_name ?? 'Unknown',
                    'count' => $items->count(),
                ];
            })
            ->values()
            ->toArray();

        // Status trends
        $statusTrends = [
            'completed' => Appointment::where('status', 'completed')->count(),
            'pending' => Appointment::where('status', 'pending')->count(),
            'cancelled' => Appointment::where('status', 'cancelled')->count(),
            'arrived' => Appointment::where('status', 'arrived')->count(),
        ];

        // Today's appointments
        $todayAppointments = Appointment::with(['user', 'company'])
            ->whereDate('appointment_date', Carbon::today())
            ->orderBy('appointment_date')
            ->get();

        // Staff count by role
        $staffByRole = [
            'doctors' => User::where('role', 'doctor')->count(),
            'medtechs' => User::where('role', 'medtech')->count(),
            'radtechs' => User::where('role', 'radtech')->count(),
            'admins' => User::where('role', 'admin')->count(),
        ];

        return Inertia::render('admin/analytics', [
            'monthlyTrends' => $monthlyTrends,
            'serviceTypeBreakdown' => $serviceTypeBreakdown,
            'companyAppointments' => $companyAppointments,
            'statusTrends' => $statusTrends,
            'todayAppointments' => $todayAppointments,
            'staffByRole' => $staffByRole,
        ]);
    }

    /**
     * Reports page for admin.
     */
    public function reports(Request $request): Response
    {
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfYear = Carbon::now()->startOfYear();

        // Appointment summary
        $totalAppointments = Appointment::count();
        $monthlyAppointments = Appointment::where('appointment_date', '>=', $startOfMonth)->count();
        $yearlyAppointments = Appointment::where('appointment_date', '>=', $startOfYear)->count();

        // Status breakdown
        $statusBreakdown = Appointment::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Type breakdown
        $typeBreakdown = Appointment::selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->get()
            ->pluck('count', 'type')
            ->toArray();

        // Top companies by appointments
        $companyAppointments = Appointment::with('company:id,company_name')
            ->whereNotNull('company_id')
            ->get()
            ->groupBy('company_id')
            ->map(function ($items) {
                return [
                    'company_name' => $items->first()->company?->company_name ?? 'Unknown',
                    'count' => $items->count(),
                ];
            })
            ->values()
            ->sortByDesc('count')
            ->take(10)
            ->toArray();

        // Recent appointments
        $recentAppointments = Appointment::with(['user', 'company'])
            ->orderBy('appointment_date', 'desc')
            ->limit(20)
            ->get();

        // Medical records summary
        $medicalRecords = [
            'physicalExams' => PhysicalExam::count(),
            'labResults' => LabResult::count(),
            'xrayReports' => XrayReport::count(),
        ];

        return Inertia::render('admin/reports', [
            'totalAppointments' => $totalAppointments,
            'monthlyAppointments' => $monthlyAppointments,
            'yearlyAppointments' => $yearlyAppointments,
            'statusBreakdown' => $statusBreakdown,
            'typeBreakdown' => $typeBreakdown,
            'topCompanies' => array_values($companyAppointments),
            'recentAppointments' => $recentAppointments,
            'medicalRecords' => $medicalRecords,
        ]);
    }
}

