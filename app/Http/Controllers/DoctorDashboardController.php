<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\MedicalExamination;
use Carbon\Carbon;
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

        $doctorQueue = fn () => Appointment::query()->where(function ($query) use ($doctor) {
            $query->where('doctor_id', $doctor->id)
                ->orWhere(function ($bulk) {
                    $bulk->whereNull('doctor_id')->whereNotNull('bulk_appointment_id');
                });
        });

        $pendingCount = $doctorQueue()
            ->whereIn('status', ['accepted', 'for_final_evaluation'])
            ->count();
        $workflowCounts = MedicalExamination::query()
            ->whereHas('appointment', fn ($query) => $query->where(function ($appointments) use ($doctor) {
                $appointments->where('doctor_id', $doctor->id)
                    ->orWhere(fn ($bulk) => $bulk->whereNull('doctor_id')->whereNotNull('bulk_appointment_id'));
            }))
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');
        $todayCount = $doctorQueue()
            ->whereIn('status', ['accepted', 'arrived', 'for_final_evaluation'])
            ->whereDate('appointment_date', today())
            ->count();
        $totalPatients = $doctorQueue()->distinct('user_id')->count('user_id');
        $availabilityDays = count(array_filter($doctor->availability ?? []));

        // ✅ NEW: Completed Physical Exams
        $completedPhysicalCount = $doctorQueue()
            ->where('status', 'completed')
            ->whereDate('updated_at', today()) // remove this if you want ALL completed
            ->count();

        $upcomingAppointments = $doctorQueue()
            ->with(['user', 'medicalExamination:id,appointment_id,status'])
            ->where(function ($query): void {
                $query->whereIn('status', ['accepted', 'arrived', 'for_final_evaluation'])
                    ->orWhere(function ($completed): void {
                        $completed->where('status', 'completed')
                            ->whereHas('medicalExamination', fn ($examination) => $examination
                                ->whereNotNull('finalized_at')
                                ->whereNull('released_at'));
                    });
            })
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
            'workflowCounts' => $workflowCounts,
        ]);
    }
}
