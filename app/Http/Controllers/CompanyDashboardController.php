<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\SecurityAudit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyDashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('company/dashboard', $this->data($request));
    }

    public function data(Request $request): array
    {
        $user = $request->user();
        $company = $user->company_id ? Company::find($user->company_id) : null;

        if (! $company) {
            abort(404, 'Company not found.');
        }

        $appointments = $company->appointments()
            ->with('user:id,first_name,last_name')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($appointment) => [
                'id' => $appointment->id,
                'patient_name' => $appointment->user?->name,
                'appointment_date' => $appointment->appointment_date?->toIso8601String(),
                'status' => $appointment->status,
                'appointment_type' => $appointment->type,
            ]);

        $appointmentStats = [
            'total' => $company->appointments()->count(),
            'upcoming' => $company->appointments()->where('appointment_date', '>', now())->count(),
            'completed' => $company->appointments()->where('status', 'completed')->count(),
        ];

        $employees = $company->users()->where('role', 'patient');
        $uploads = SecurityAudit::query()
            ->where('actor_id', $user->id)
            ->where('action', 'company_employee_import_completed')
            ->latest()
            ->take(8)
            ->get(['id', 'status', 'metadata', 'created_at'])
            ->map(fn ($audit) => [
                'id' => $audit->id,
                'status' => $audit->status,
                'file_name' => $audit->metadata['file_name'] ?? 'Employee spreadsheet',
                'total' => (int) ($audit->metadata['total'] ?? 0),
                'imported' => (int) ($audit->metadata['imported'] ?? 0),
                'duplicates' => (int) ($audit->metadata['duplicates'] ?? 0),
                'failed' => (int) ($audit->metadata['failed'] ?? 0),
                'created_at' => $audit->created_at->toIso8601String(),
            ]);

        return [
            'user' => $user,
            'company' => $company,
            'appointments' => $appointments,
            'stats' => $appointmentStats,
            'employeeStats' => [
                'total' => (clone $employees)->count(),
                'active' => (clone $employees)->where('is_active', true)->count(),
                'preregistered' => (clone $employees)->where('is_active', false)->count(),
                'rejected' => (int) $uploads->sum('failed'),
            ],
            'uploads' => $uploads,
        ];
    }
}
