<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyBulkAppointmentController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->company_id, 404, 'Company not found.');

        $baseQuery = Appointment::query()
            ->where('company_id', $user->company_id)
            ->where('user_id', $user->id)
            ->where('type', 'company_bulk');

        $summary = [
            'total' => (clone $baseQuery)->count(),
            'pending' => (clone $baseQuery)->where('status', 'pending')->count(),
            'scheduled' => (clone $baseQuery)->where('status', 'accepted')->count(),
            'in_progress' => (clone $baseQuery)->whereIn('status', [
                'arrived',
                'for_diagnostics',
                'for_xray',
                'for_final_evaluation',
            ])->count(),
            'completed' => (clone $baseQuery)->where('status', 'completed')->count(),
        ];

        $appointments = $baseQuery
            ->with('bulkMedicalReport:id,bulk_appointment_id,status,released_at')
            ->withCount([
                'bulkEmployees',
                'bulkEmployees as arrived_employees_count' => fn ($query) => $query->where('attendance_status', 'arrived'),
                'bulkEmployees as completed_employees_count' => fn ($query) => $query->where('status', 'completed'),
            ])
            ->orderByDesc('appointment_date')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Appointment $appointment): array => [
                'id' => $appointment->id,
                'appointment_date' => $appointment->appointment_date?->toDateString(),
                'event_end_date' => $appointment->event_end_date?->toDateString(),
                'start_time' => $appointment->start_time?->format('H:i'),
                'end_time' => $appointment->end_time?->format('H:i'),
                'status' => $appointment->status,
                'onsite_event_status' => $appointment->onsite_event_status,
                'service_types' => $appointment->service_types ?? [],
                'service_location' => $appointment->service_location,
                'event_address' => $appointment->event_address,
                'expected_employee_count' => $appointment->expected_employee_count,
                'employee_count' => $appointment->bulk_employees_count,
                'arrived_count' => $appointment->arrived_employees_count,
                'completed_count' => $appointment->completed_employees_count,
                'report_status' => $appointment->bulkMedicalReport?->status,
                'report_download_url' => $appointment->bulkMedicalReport?->released_at
                    ? route('company.bulk-medical-results.download', $appointment)
                    : null,
                'masterlist_url' => $appointment->onsite_event_status === 'draft'
                    ? route('company.dashboard', ['bulk_upload' => $appointment->id]).'#employee-upload-panel'
                    : null,
            ]);

        return Inertia::render('company/bulk-appointments/index', [
            'appointments' => $appointments,
            'summary' => $summary,
        ]);
    }
}
