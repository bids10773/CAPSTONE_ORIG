<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\PatientMedicalProfileService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminPatientController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'presence' => ['nullable', Rule::in(['online', 'offline'])],
            'active_days' => ['nullable', Rule::in(['today', '7', '30', 'inactive_30', 'never'])],
            'per_page' => ['nullable', 'integer'],
        ]);
        $search = trim((string) ($filters['search'] ?? ''));
        $presence = (string) ($filters['presence'] ?? '');
        $activeDays = (string) ($filters['active_days'] ?? '');
        $onlineThreshold = now()->subMinutes(5)->timestamp;

        $latestSessions = DB::table(config('session.table', 'sessions'))
            ->whereNotNull('user_id')
            ->select('user_id')
            ->selectRaw('MAX(last_activity) as last_activity')
            ->groupBy('user_id');

        $patients = User::query()
            ->where('users.role', 'patient')
            ->with('patientProfile')
            ->leftJoinSub(
                $latestSessions,
                'patient_sessions',
                fn ($join) => $join->on('users.id', '=', 'patient_sessions.user_id'),
            )
            ->select('users.*')
            ->addSelect('patient_sessions.last_activity')
            ->withExists('socialAccounts')
            ->withCount('appointments')
            ->when($search !== '', function ($query) use ($search): void {
                foreach (preg_split('/\s+/', $search) ?: [] as $term) {
                    $query->where(function ($patientQuery) use ($term): void {
                        $like = "%{$term}%";
                        $patientQuery
                            ->where('users.first_name', 'like', $like)
                            ->orWhere('users.middle_name', 'like', $like)
                            ->orWhere('users.last_name', 'like', $like)
                            ->orWhere('users.email', 'like', $like)
                            ->orWhere('users.contact', 'like', $like)
                            ->orWhereHas('patientProfile', function ($profileQuery) use ($like): void {
                                $profileQuery
                                    ->where('employee_number', 'like', $like)
                                    ->orWhere('address', 'like', $like);
                            });

                        if (preg_match('/^PAT0*(\d+)$/i', $term, $matches) === 1) {
                            $patientQuery->orWhere('users.id', (int) $matches[1]);
                        }
                    });
                }
            })
            ->when($presence === 'online', fn ($query) => $query->where('patient_sessions.last_activity', '>=', $onlineThreshold))
            ->when($presence === 'offline', fn ($query) => $query->where(function ($presenceQuery) use ($onlineThreshold): void {
                $presenceQuery
                    ->whereNull('patient_sessions.last_activity')
                    ->orWhere('patient_sessions.last_activity', '<', $onlineThreshold);
            }))
            ->when(in_array($activeDays, ['today', '7', '30'], true), function ($query) use ($activeDays): void {
                $cutoff = match ($activeDays) {
                    'today' => now()->startOfDay(),
                    '7' => now()->subDays(7),
                    default => now()->subDays(30),
                };
                $query->where(function ($activityQuery) use ($cutoff): void {
                    $activityQuery
                        ->where('users.last_active_at', '>=', $cutoff)
                        ->orWhere('patient_sessions.last_activity', '>=', $cutoff->timestamp);
                });
            })
            ->when($activeDays === 'inactive_30', function ($query): void {
                $cutoff = now()->subDays(30);
                $query
                    ->where(function ($knownActivity): void {
                        $knownActivity
                            ->whereNotNull('users.last_active_at')
                            ->orWhereNotNull('patient_sessions.last_activity');
                    })
                    ->where(function ($activityQuery) use ($cutoff): void {
                        $activityQuery
                            ->where(function ($storedActivity) use ($cutoff): void {
                                $storedActivity
                                    ->whereNull('users.last_active_at')
                                    ->orWhere('users.last_active_at', '<', $cutoff);
                            })
                            ->where(function ($sessionActivity) use ($cutoff): void {
                                $sessionActivity
                                    ->whereNull('patient_sessions.last_activity')
                                    ->orWhere('patient_sessions.last_activity', '<', $cutoff->timestamp);
                            });
                    });
            })
            ->when($activeDays === 'never', fn ($query) => $query
                ->whereNull('users.last_active_at')
                ->whereNull('patient_sessions.last_activity'))
            ->orderByRaw('CASE WHEN patient_sessions.last_activity >= ? THEN 0 ELSE 1 END', [$onlineThreshold])
            ->orderBy('users.last_name')
            ->orderBy('users.first_name')
            ->paginate($this->perPage($request))
            ->withQueryString()
            ->through(function (User $patient) use ($onlineThreshold): array {
                $lastActivity = $patient->getAttribute('last_activity');
                $sessionActivity = $lastActivity !== null
                    ? Carbon::createFromTimestamp((int) $lastActivity)
                    : null;
                $storedActivity = $patient->last_active_at;
                $latestActivity = collect([$sessionActivity, $storedActivity])
                    ->filter()
                    ->sortByDesc(fn ($activity) => $activity->timestamp)
                    ->first();
                $profile = $patient->patientProfile;

                return [
                    'id' => $patient->id,
                    'patient_reference_code' => $patient->patient_reference_code,
                    'first_name' => $patient->first_name,
                    'middle_name' => $patient->middle_name,
                    'last_name' => $patient->last_name,
                    'email' => $patient->email,
                    'contact' => $patient->contact,
                    'created_at' => $patient->created_at,
                    'email_verified_at' => $patient->email_verified_at,
                    'has_account' => $patient->password !== null || $patient->social_accounts_exists,
                    'appointments_count' => $patient->appointments_count,
                    'is_online' => $lastActivity !== null && (int) $lastActivity >= $onlineThreshold,
                    'last_active_at' => $latestActivity?->toIso8601String(),
                    'days_since_active' => $latestActivity
                        ? (int) $latestActivity->copy()->startOfDay()->diffInDays(today())
                        : null,
                    'profile' => $profile ? [
                        'birthdate' => $profile->birthdate?->format('Y-m-d'),
                        'age' => $profile->age,
                        'sex' => $profile->sex,
                        'civil_status' => $profile->civil_status,
                        'address' => $profile->address,
                        'employee_number' => $profile->employee_number,
                    ] : null,
                ];
            });

        return Inertia::render('admin/patients/index', [
            'patients' => $patients,
            'filters' => [
                'search' => $search,
                'presence' => $presence,
                'active_days' => $activeDays,
            ],
        ]);
    }

    public function show(User $patient, PatientMedicalProfileService $medicalProfile): Response
    {
        abort_unless($patient->role === 'patient', 404);
        $patient->load('patientProfile', 'company:id,company_name');
        $patient->patientProfile?->append('age');

        return Inertia::render('admin/patients/show', [
            'patient' => $patient,
            'medicalRecords' => $medicalProfile->recordsFor($patient, releasedOnly: false),
            'medicalReports' => $medicalProfile->adminReportsFor($patient),
        ]);
    }
}
