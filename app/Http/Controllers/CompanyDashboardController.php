<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Company;


class CompanyDashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $user = $request->user();
        
        $company = $user->company()->first() ?? $user->company_id ? Company::find($user->company_id) : null;
        if (!$company) {
            abort(404, 'Company not found.');
        }
        $appointments = $company->appointments()
            ->latest()
            ->take(10)
            ->get();
        
        $stats = [
            'total' => $company->appointments()->count(),
            'upcoming' => $company->appointments()->where('appointment_date', '>', now())->count(),
            'completed' => $company->appointments()->whereNotNull('lab_result_id')->whereNotNull('xray_report_id')->whereNotNull('physical_exam_id')->count(),
        ];

        return Inertia::render('company/dashboard', [
            'user' => $user,
            'company' => $company,
            'appointments' => $appointments,
            'stats' => $stats,
        ]);
    }
}

