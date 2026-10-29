<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\MedicalDocument;
use App\Services\MedicalDocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientDashboardController extends Controller
{
    public function __invoke(Request $request, MedicalDocumentService $documents): Response|RedirectResponse
    {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | 1. GUEST VIEW (PUBLIC LANDING PAGE)
        |--------------------------------------------------------------------------
        | If user is not logged in, show welcome/landing page
        */
        if (! $user) {
            return Inertia::render('welcome', ['clinicHours' => \App\Support\ClinicHours::publicSettings()]);
        }

        /*
        |--------------------------------------------------------------------------
        | 2. EMAIL VERIFICATION CHECK
        |--------------------------------------------------------------------------
        | Ensures only verified patients can access dashboard
        | (Admins/staff can bypass via your staff.verified middleware)
        */
        if (! $user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        $documents->synchronizePatient($user);

        /*
        |--------------------------------------------------------------------------
        | 3. FETCH PATIENT APPOINTMENT DATA
        |--------------------------------------------------------------------------
        | Optimized queries scoped to authenticated patient only
        */
        $appointments = Appointment::with([
            'company',
            'physicalExam:id,appointment_id,is_completed',
            'labResult:id,appointment_id',
            'xrayReport:id,appointment_id,status,performed_at,verified_at',
            'medicalExamination:id,appointment_id,status,finalized_at,released_at',
            'medicalExamination.diagnosticResults:id,medical_examination_id,service_key,status,verified_at',
        ])
            ->where('user_id', $user->id)
            ->latest('appointment_date')
            ->limit(10)
            ->get()
            ->each(function (Appointment $appointment): void {
                $examination = $appointment->medicalExamination;
                if ($examination === null || ! $appointment->requiresPhysicalExamination()) {
                    return;
                }

                $examination->setRelation('appointment', $appointment);
                $examination->setRelation('physicalExam', $appointment->physicalExam);
                $examination->setRelation('laboratoryResult', $appointment->labResult);
                $examination->setRelation('xrayReport', $appointment->xrayReport);

                $appointment->setAttribute('medical_workflow', [
                    'status' => $examination->status,
                    'finalized' => $examination->finalized_at !== null,
                    'report_available' => $examination->released_at !== null,
                    'stages' => $examination->childSummaries(),
                ]);
                $examination->unsetRelation('diagnosticResults');
            });

        $upcomingAppointments = Appointment::with('company')
            ->where('user_id', $user->id)
            ->whereDate('appointment_date', '>=', now())
            ->whereIn('status', [
                'pending',
                'accepted',
                'arrived',
                'for_diagnostics',
                'for_xray',
                'awaiting_xray_result',
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
        $appointmentCounts = Appointment::query()
            ->where('user_id', $user->id)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed")
            ->selectRaw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending")
            ->selectRaw("SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted")
            ->selectRaw("SUM(CASE WHEN status = 'arrived' THEN 1 ELSE 0 END) as physical")
            ->selectRaw("SUM(CASE WHEN status = 'for_diagnostics' THEN 1 ELSE 0 END) as laboratory")
            ->selectRaw("SUM(CASE WHEN status = 'for_final_evaluation' THEN 1 ELSE 0 END) as final_evaluation")
            ->first();

        $stats = collect([
            'total',
            'completed',
            'pending',
            'accepted',
            'physical',
            'laboratory',
            'final_evaluation',
        ])->mapWithKeys(fn (string $key): array => [$key => (int) $appointmentCounts->{$key}])->all();

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
            'medicalDocuments' => MedicalDocument::query()->releaseVisible()->where('patient_id', $user->id)
                ->latest('requested_at')->limit(4)->get()->map(fn (MedicalDocument $document): array => [
                    'id' => $document->id, 'title' => $document->title, 'status' => $document->status,
                    'requested_at' => $document->requested_at?->toIso8601String(),
                ]),
            'releaseInstructions' => config('medical.document_release.instructions'),
        ]);
    }
}
