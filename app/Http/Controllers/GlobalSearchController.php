<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Company;
use App\Models\MedicalCertificate;
use App\Models\MedicalDocument;
use App\Models\User;
use App\Support\SearchTerm;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class GlobalSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $categories = $this->categories($user);
        abort_if($categories === [], 403);
        $category = $this->validatedCategory($request, $categories);

        if (! $request->has('q')) {
            return response()->json(['categories' => $categories, 'groups' => [], 'recent' => $this->recent($request, $categories)]);
        }

        $term = $this->validatedTerm($request);

        return response()->json(['categories' => $categories, 'groups' => $this->groups($user, $term, $category)]);
    }

    public function storeRecent(Request $request): Response
    {
        $categories = $this->categories($request->user());
        abort_if($categories === [], 403);
        $category = $this->validatedCategory($request, $categories);
        $term = $this->validatedTerm($request);
        if ($this->groups($request->user(), $term, $category, true) !== []) {
            $key = $this->historyKey($request);
            Cache::lock($key.':lock', 10)->block(3, function () use ($request, $categories, $term, $category, $key): void {
                $recent = collect($this->recent($request, $categories))
                    ->reject(fn (array $entry): bool => mb_strtolower($entry['query']) === mb_strtolower($term) && $entry['category'] === $category)
                    ->prepend(['query' => $term, 'category' => $category])->take(6)->values()->all();
                Cache::put($key, $recent, now()->addDay());
            });
        }

        return response()->noContent();
    }

    private function historyKey(Request $request): string
    {
        $user = $request->user();

        return 'global-search-recent:'.hash('sha256', json_encode([$request->session()->getId(), $user->id, $user->role, $user->company_id]));
    }

    private function recent(Request $request, array $categories): array
    {
        $allowed = ['all', ...array_column($categories, 'key')];
        $recent = collect(Cache::get($this->historyKey($request), []))
            ->take(6)->filter(fn ($entry): bool => is_array($entry)
                && is_string($entry['query'] ?? null) && mb_strlen($entry['query']) >= 1 && mb_strlen($entry['query']) <= 100
                && in_array($entry['category'] ?? null, $allowed, true)
                && $this->groups($request->user(), $entry['query'], $entry['category'], true) !== [])
            ->map(fn (array $entry): array => ['query' => $entry['query'], 'category' => $entry['category']])
            ->values()->all();

        return $recent;
    }

    private function validatedCategory(Request $request, array $categories): string
    {
        $request->validate(['category' => ['sometimes', 'string', Rule::in(['all', 'appointments', 'patients', 'companies', 'certificates', 'documents', 'staff'])]]);
        $category = $request->input('category', 'all');
        abort_unless($category === 'all' || in_array($category, array_column($categories, 'key'), true), 403);

        return $category;
    }

    private function validatedTerm(Request $request): string
    {
        if (is_string($request->input('q'))) {
            $request->merge([
                'q' => SearchTerm::normalize($request->input('q')),
            ]);
        }

        $validated = $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:100'],
        ]);

        return $validated['q'];
    }

    private function groups(User $user, string $term, string $category, bool $firstOnly = false): array
    {
        $factories = [
            'appointments' => fn () => $this->appointmentGroup($user, $term),
            'patients' => fn () => $this->patientGroup($user, $term),
            'companies' => fn () => $this->companyGroup($user, $term),
            'certificates' => fn () => $this->certificateGroup($user, $term),
            'documents' => fn () => $this->documentGroup($user, $term),
            'staff' => fn () => $this->staffGroup($user, $term),
        ];
        $groups = [];
        foreach ($factories as $key => $factory) {
            if ($category !== 'all' && $key !== $category) {
                continue;
            }
            $group = $factory();
            if ($group !== null && $group['items'] !== []) {
                $groups[] = $group;
                if ($firstOnly) {
                    break;
                }
            }
        }

        return $groups;
    }

    private function categories(User $user): array
    {
        $keys = match ($user->role) {
            'admin' => ['appointments', 'patients', 'companies'],
            'receptionist', 'company' => ['appointments', 'patients'],
            'doctor', 'medtech', 'radtech', 'patient' => ['appointments'],
            default => [],
        };
        if ($keys === []) {
            return [];
        }
        if (Gate::forUser($user)->allows('viewAny', MedicalCertificate::class)) {
            $keys[] = 'certificates';
        }
        if (Gate::forUser($user)->allows('viewAny', MedicalDocument::class)) {
            $keys[] = 'documents';
        }
        if ($user->role === 'admin') {
            $keys[] = 'staff';
        }

        return array_map(fn (string $key): array => [
            'key' => $key,
            'title' => match ($key) {
                'patients' => 'Patients',
                'companies' => 'Companies',
                'certificates' => 'Certificates',
                'documents' => 'Documents',
                'staff' => 'Staff',
                default => $user->role === 'patient' ? 'My appointments' : 'Appointments',
            },
        ], $keys);
    }

    private function appointmentGroup(User $user, string $term): ?array
    {
        $query = Appointment::query()
            ->with(['user:id,first_name,middle_name,last_name,role,sex', 'company:id,company_name'])
            ->select(['id', 'user_id', 'company_id', 'doctor_id', 'appointment_date', 'arrived_at', 'attendance_status', 'bulk_appointment_id', 'examination_purpose', 'type', 'status', 'service_types']);

        match ($user->role) {
            'admin' => null,
            'receptionist' => $query->whereDate('appointment_date', today()),
            'doctor' => $query->where(fn (Builder $access) => $access
                ->where('doctor_id', $user->id)
                ->orWhereHas('serviceQueues', fn (Builder $queue) => $queue
                    ->where('assigned_staff_id', $user->id)
                    ->whereIn('service_role', ['doctor', 'drug_verification', 'final_evaluation']))
                ->orWhereHas('medicalExamination', fn (Builder $exam) => $exam
                    ->where('examining_doctor_id', $user->id)
                    ->orWhere('finalized_by', $user->id))),
            'medtech' => $query->where(fn (Builder $access) => $access
                ->whereHas('labResult', fn (Builder $lab) => $lab->where('encoded_by', $user->id))
                ->orWhereHas('serviceQueues', fn (Builder $queue) => $queue
                    ->where('assigned_staff_id', $user->id)
                    ->where('service_role', 'medtech'))
                ->orWhere(fn (Builder $available) => $available
                    ->whereNull('bulk_appointment_id')
                    ->whereIn('status', ['for_diagnostics', 'verifying_drug_test']))),
            'radtech' => $query->where(fn (Builder $access) => $access
                ->whereHas('xrayReport', fn (Builder $xray) => $xray->where('radiologist_id', $user->id))
                ->orWhereHas('serviceQueues', fn (Builder $queue) => $queue
                    ->where('assigned_staff_id', $user->id)
                    ->where('service_role', 'radtech'))
                ->orWhere(fn (Builder $available) => $available
                    ->whereNull('bulk_appointment_id')
                    ->whereIn('status', ['for_xray', 'awaiting_xray_result', 'verifying_xray']))),
            'company' => $user->company_id
                ? $query->where('company_id', $user->company_id)
                : $query->whereRaw('1 = 0'),
            default => $query->where('user_id', $user->id),
        };

        $this->matchAppointment($query, $term);

        $items = $query->latest('appointment_date')->limit(6)->get()->map(fn (Appointment $appointment): array => [
            'id' => 'appointment-'.$appointment->id,
            'type' => 'appointment',
            'title' => $appointment->reference_code.' · '.($appointment->user?->name ?? 'Patient'),
            'subtitle' => $appointment->appointment_date?->format('M j, Y').' · '.implode(', ', $appointment->service_types ?? []).' · '.str($appointment->status)->replace('_', ' ')->title(),
            'url' => $this->appointmentUrl($user, $appointment),
        ])->all();

        $title = match ($user->role) {
            'doctor' => 'Assigned patients and records',
            'medtech' => 'Laboratory patients and records',
            'radtech' => 'Radiology patients and records',
            'receptionist' => "Today's appointments",
            'company' => 'Employee records',
            'patient' => 'My appointments and records',
            default => 'Appointments and records',
        };

        return ['key' => 'appointments', 'title' => $title, 'items' => $items];
    }

    private function patientGroup(User $user, string $term): ?array
    {
        if (! in_array($user->role, ['admin', 'receptionist', 'company'], true)) {
            return null;
        }

        $query = User::query()->where('role', 'patient')->select(['id', 'first_name', 'middle_name', 'last_name', 'email', 'role', 'company_id']);
        if ($user->role === 'company') {
            $user->company_id
                ? $query->where('company_id', $user->company_id)->where('role', 'patient')
                : $query->whereRaw('1 = 0');
        }

        $this->matchUser($query, $term);
        $items = $query->orderBy('last_name')->limit(6)->get()->map(function (User $person) use ($user): array {
            $url = match ($user->role) {
                'admin' => route('admin.patients.show', $person),
                'receptionist' => route('receptionist.queue.index', ['search' => $person->name]),
                default => route('company.dashboard'),
            };

            return [
                'id' => 'person-'.$person->id,
                'type' => 'person',
                'title' => $person->name,
                'subtitle' => str($person->role)->title().' · '.($person->email ?: 'No email address'),
                'url' => $url,
            ];
        })->all();

        return ['key' => 'patients', 'title' => 'Patients', 'items' => $items];
    }

    private function staffGroup(User $user, string $term): ?array
    {
        if ($user->role !== 'admin') {
            return null;
        }

        $query = User::query()->whereIn('role', ['doctor', 'medtech', 'radtech', 'receptionist'])
            ->select(['id', 'first_name', 'middle_name', 'last_name', 'email', 'role']);
        $this->matchUser($query, $term);
        $items = $query->orderBy('last_name')->limit(6)->get()->map(fn (User $staff): array => [
            'id' => 'staff-'.$staff->id,
            'type' => 'staff',
            'title' => $staff->name,
            'subtitle' => $staff->role_label.' · '.($staff->email ?: 'No email address'),
            'url' => route('admin.staff.index', ['search' => $staff->email ?: $staff->name]),
        ])->all();

        return ['key' => 'staff', 'title' => 'Staff', 'items' => $items];
    }

    private function certificateGroup(User $user, string $term): ?array
    {
        if (! Gate::forUser($user)->allows('viewAny', MedicalCertificate::class)) {
            return null;
        }

        $like = SearchTerm::forLike($term);
        $items = MedicalCertificate::query()
            ->select(['id', 'certificate_number', 'patient_name', 'status', 'attending_physician_id'])
            ->when($user->role === 'doctor', fn (Builder $query) => $query->where('attending_physician_id', $user->id))
            ->where(fn (Builder $query) => $query
                ->where('certificate_number', 'like', "%{$like}%")
                ->orWhere('patient_name', 'like', "%{$like}%")
                ->orWhere('patient_reference_code', 'like', "%{$like}%")
                ->orWhere('physician_name', 'like', "%{$like}%"))
            ->latest('id')->limit(6)->get()->map(fn (MedicalCertificate $certificate): array => [
                'id' => 'certificate-'.$certificate->id,
                'type' => 'certificate',
                'title' => $certificate->certificate_number,
                'subtitle' => $certificate->patient_name.' · '.str($certificate->status)->replace('_', ' ')->title(),
                'url' => route('medical-certificates.show', $certificate),
            ])->all();

        return ['key' => 'certificates', 'title' => 'Certificates', 'items' => $items];
    }

    private function documentGroup(User $user, string $term): ?array
    {
        if (! Gate::forUser($user)->allows('viewAny', MedicalDocument::class)) {
            return null;
        }

        $query = MedicalDocument::query()->with('patient:id,first_name,middle_name,last_name');
        if ($user->role === 'patient') {
            $query->releaseVisible()->where('patient_id', $user->id);
        } else {
            $query->visibleTo($user);
        }
        $like = SearchTerm::forLike($term);
        $items = $query->select(['id', 'document_number', 'patient_id', 'appointment_id', 'title', 'status'])
            ->where(fn (Builder $match) => $match
                ->where('document_number', 'like', "%{$like}%")
                ->orWhere('title', 'like', "%{$like}%")
                ->orWhereHas('patient', fn (Builder $patient) => $this->matchUser($patient, $term)))
            ->latest('id')->limit(6)->get()->map(fn (MedicalDocument $document): array => [
                'id' => 'document-'.$document->id,
                'type' => 'document',
                'title' => $document->document_number.' · '.$document->title,
                'subtitle' => ($document->patient?->name ?? 'Patient').' · '.str($document->status)->replace('_', ' ')->title(),
                'url' => $user->role === 'patient'
                    ? route('medical-documents.patient', $document->appointment_id ? ['appointment' => $document->appointment_id] : [])
                    : route('medical-documents.index', ['search' => $document->document_number]),
            ])->all();

        return ['key' => 'documents', 'title' => 'Documents', 'items' => $items];
    }

    private function companyGroup(User $user, string $term): ?array
    {
        if ($user->role !== 'admin') {
            return null;
        }

        $likeTerm = SearchTerm::forLike($term);
        $items = Company::query()
            ->select(['id', 'company_name', 'email', 'status'])
            ->where(fn (Builder $query) => $query
                ->where('company_name', 'like', "%{$likeTerm}%")
                ->orWhere('email', 'like', "%{$likeTerm}%"))
            ->orderBy('company_name')
            ->limit(6)
            ->get()
            ->map(fn (Company $company): array => [
                'id' => 'company-'.$company->id,
                'type' => 'company',
                'title' => $company->company_name,
                'subtitle' => str($company->status)->title().' · '.($company->email ?: 'No email address'),
                'url' => route('admin.companies.show', $company),
            ])->all();

        return ['key' => 'companies', 'title' => 'Companies', 'items' => $items];
    }

    private function matchAppointment(Builder $query, string $term): void
    {
        $likeTerm = SearchTerm::forLike($term);
        $query->where(function (Builder $query) use ($term, $likeTerm): void {
            $query->when(ctype_digit($term), fn (Builder $query) => $query->orWhereKey((int) $term))
                ->when($this->referenceParts($term), function (Builder $query, array $reference): void {
                    $query->orWhere(fn (Builder $referenceQuery) => $referenceQuery
                        ->whereKey($reference['id'])
                        ->whereIn('type', $reference['types']));
                })
                ->orWhereHas('user', fn (Builder $patient) => $this->matchUser($patient, $term))
                ->orWhereHas('company', fn (Builder $company) => $company->where('company_name', 'like', "%{$likeTerm}%"))
                ->orWhere('status', 'like', "%{$likeTerm}%")
                ->orWhere('service_types', 'like', "%{$likeTerm}%");
        });
    }

    private function referenceParts(string $term): ?array
    {
        return Appointment::parseReferenceCode($term);
    }

    private function matchUser(Builder $query, string $term): void
    {
        $likeTerm = SearchTerm::forLike($term);
        $query->where(function (Builder $query) use ($term, $likeTerm): void {
            $query->where('first_name', 'like', "%{$likeTerm}%")
                ->orWhere('middle_name', 'like', "%{$likeTerm}%")
                ->orWhere('last_name', 'like', "%{$likeTerm}%")
                ->orWhere('email', 'like', "%{$likeTerm}%");

            if (preg_match('/^PAT0*(\d+)$/i', $term, $matches) === 1) {
                $query->orWhere(fn (Builder $patient) => $patient
                    ->where('role', 'patient')
                    ->whereKey((int) $matches[1]));
            }
        });
    }

    private function appointmentUrl(User $user, Appointment $appointment): string
    {
        return match ($user->role) {
            'admin' => route('admin.appointments.show', $appointment),
            'receptionist' => route('receptionist.queue.index', ['search' => $appointment->user?->name]),
            'doctor' => $appointment->status === 'for_final_evaluation' && Gate::forUser($user)->allows('finalizeMedicalEvaluation', $appointment)
                ? route('doctor.final-evaluation', $appointment)
                : (Gate::forUser($user)->allows('updatePhysicalExam', $appointment)
                    ? route('doctor.physical-exams.create', $appointment)
                    : route('doctor.patient-records.index', ['search' => $appointment->user?->name])),
            'medtech' => Gate::forUser($user)->allows('updateLaboratory', $appointment)
                ? route('medtech.lab-results.create', $appointment)
                : route('medtech.patient-records.index', ['search' => $appointment->user?->name]),
            'radtech' => Gate::forUser($user)->allows('updateXray', $appointment)
                ? route('radtech.xrays.create', $appointment)
                : route('radtech.patient-records.index', ['search' => $appointment->user?->name]),
            'company' => route('company.dashboard'),
            default => route('appointments.show', $appointment),
        };
    }
}
