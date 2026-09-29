<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use App\Support\SearchTerm;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        if (is_string($request->input('q'))) {
            $request->merge([
                'q' => SearchTerm::normalize($request->input('q')),
            ]);
        }

        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);
        $term = $validated['q'];
        $user = $request->user();

        $groups = collect([
            $this->appointmentGroup($user, $term),
            $this->peopleGroup($user, $term),
            $this->companyGroup($user, $term),
        ])->filter(fn (?array $group): bool => $group !== null && $group['items'] !== [])->values();

        return response()->json(['groups' => $groups]);
    }

    private function appointmentGroup(User $user, string $term): ?array
    {
        $query = Appointment::query()
            ->with(['user:id,first_name,middle_name,last_name', 'company:id,company_name'])
            ->select(['id', 'user_id', 'company_id', 'doctor_id', 'appointment_date', 'type', 'status', 'service_types']);

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

    private function peopleGroup(User $user, string $term): ?array
    {
        if (! in_array($user->role, ['admin', 'receptionist', 'company'], true)) {
            return null;
        }

        $query = User::query()->select(['id', 'first_name', 'middle_name', 'last_name', 'email', 'role', 'company_id']);
        if ($user->role === 'company') {
            $user->company_id
                ? $query->where('company_id', $user->company_id)->where('role', 'patient')
                : $query->whereRaw('1 = 0');
        } elseif ($user->role === 'receptionist') {
            $query->where('role', 'patient');
        } else {
            $query->whereIn('role', ['patient', 'doctor', 'medtech', 'radtech', 'receptionist']);
        }

        $this->matchUser($query, $term);
        $items = $query->orderBy('last_name')->limit(6)->get()->map(function (User $person) use ($user): array {
            $url = match ($user->role) {
                'admin' => $person->role === 'patient'
                    ? route('admin.appointments.index', ['search' => $person->email ?: $person->name])
                    : route('admin.staff.index', ['search' => $person->email ?: $person->name]),
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

        return ['key' => 'people', 'title' => $user->role === 'company' ? 'Employees' : 'People', 'items' => $items];
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
        if (! preg_match('/^(APT|WLK|REF)0*(\d+)$/i', $term, $matches)) {
            return null;
        }

        return [
            'id' => (int) $matches[2],
            'types' => match (strtoupper($matches[1])) {
                'WLK' => ['walk_in'],
                'REF' => ['company_referral'],
                default => ['individual', 'company_bulk'],
            },
        ];
    }

    private function matchUser(Builder $query, string $term): void
    {
        $likeTerm = SearchTerm::forLike($term);
        $query->where(fn (Builder $query) => $query
            ->where('first_name', 'like', "%{$likeTerm}%")
            ->orWhere('middle_name', 'like', "%{$likeTerm}%")
            ->orWhere('last_name', 'like', "%{$likeTerm}%")
            ->orWhere('email', 'like', "%{$likeTerm}%"));
    }

    private function appointmentUrl(User $user, Appointment $appointment): string
    {
        return match ($user->role) {
            'admin' => route('admin.appointments.show', $appointment),
            'receptionist' => route('receptionist.queue.index', ['search' => $appointment->user?->name]),
            'doctor' => $appointment->status === 'for_final_evaluation'
                ? route('doctor.final-evaluation', $appointment)
                : (in_array($appointment->status, ['accepted', 'arrived'], true)
                    && $appointment->appointment_date?->isToday()
                    ? route('doctor.physical-exams.create', $appointment)
                    : route('doctor.patient-records.index', ['search' => $appointment->user?->name])),
            'medtech' => in_array($appointment->status, ['for_diagnostics', 'verifying_drug_test'], true)
                ? route('medtech.lab-results.create', $appointment)
                : route('medtech.patient-records.index', ['search' => $appointment->user?->name]),
            'radtech' => in_array($appointment->status, ['for_xray', 'awaiting_xray_result', 'verifying_xray'], true)
                ? route('radtech.xrays.create', $appointment)
                : route('radtech.patient-records.index', ['search' => $appointment->user?->name]),
            'company' => route('company.dashboard'),
            default => route('appointments.show', $appointment),
        };
    }
}
