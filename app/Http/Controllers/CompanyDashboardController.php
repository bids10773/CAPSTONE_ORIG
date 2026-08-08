<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Company;
use App\Models\SecurityAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
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

        $bulkAppointments = $company->appointments()
            ->where('user_id', $user->id)
            ->where('type', 'company_bulk')
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->orderByDesc('appointment_date')
            ->get(['id', 'appointment_date', 'status', 'service_types'])
            ->map(fn ($appointment) => [
                'id' => $appointment->id,
                'appointment_date' => $appointment->appointment_date?->toDateString(),
                'status' => $appointment->status,
                'service_types' => $appointment->service_types ?? [],
            ]);

        $employees = $company->users()->where('role', 'patient');
        $previewToken = (string) $request->query('preview_token', '');
        $importPreview = null;
        if (Str::isUuid($previewToken)) {
            $cachedPreview = Cache::get("company-employee-import:{$user->id}:{$previewToken}");
            if (is_array($cachedPreview)) {
                $importPreview = [...$cachedPreview, 'token' => $previewToken];
            }
        }
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

        $referrals = $company->referrals()
            ->with('appointment:id,company_referral_id,status,appointment_date')
            ->latest()
            ->take(50)
            ->get()
            ->map(function ($referral): array {
                $status = match ($referral->appointment?->status) {
                    'completed' => 'completed',
                    'arrived', 'for_diagnostics', 'for_xray', 'for_final_evaluation' => 'in_progress',
                    default => $referral->status,
                };
                if ($referral->isExpired() && in_array($status, ['pending', 'sent', 'viewed'], true)) {
                    $status = 'expired';
                }

                return [
                    'id' => $referral->id,
                    'referral_number' => $referral->referral_number,
                    'employee_name' => trim($referral->first_name.' '.$referral->middle_name.' '.$referral->last_name),
                    'status' => $status,
                    'valid_until' => $referral->valid_until->toDateString(),
                    'appointment_date' => $referral->appointment?->appointment_date?->toDateString(),
                    'can_cancel' => $referral->isSchedulable(),
                ];
            });

        return [
            'user' => $user,
            'company' => $company,
            'appointments' => $appointments,
            'bulkAppointments' => $bulkAppointments,
            'stats' => $appointmentStats,
            'employeeStats' => [
                'total' => (clone $employees)->count(),
                'active' => (clone $employees)->where('is_active', true)->count(),
                'preregistered' => (clone $employees)->where('is_active', false)->count(),
                'rejected' => (int) $uploads->sum('failed'),
            ],
            'uploads' => $uploads,
            'importPreview' => $importPreview,
            'referrals' => $referrals,
            'referralStats' => [
                'pending' => $referrals->whereIn('status', ['pending', 'sent', 'viewed'])->count(),
                'scheduled' => $referrals->where('status', 'scheduled')->count(),
                'completed' => $referrals->where('status', 'completed')->count(),
                'expired' => $referrals->where('status', 'expired')->count(),
            ],
            'serviceTypes' => Appointment::getServiceTypeOptions(),
        ];
    }
}
