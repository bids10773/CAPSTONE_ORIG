<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);
        $term = trim($validated['q']);
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
            'doctor' => $query->where('doctor_id', $user->id),
            'medtech' => $query->whereIn('status', ['for_diagnostics', 'for_final_evaluation', 'completed']),
            'radtech' => $query->whereIn('status', ['for_xray', 'awaiting_xray_result', 'for_final_evaluation', 'completed']),
            'company' => $query->where('company_id', $user->company_id),
            default => $query->where('user_id', $user->id),
        };

        $this->matchAppointment($query, $term);

        $items = $query->latest('appointment_date')->limit(6)->get()->map(fn (Appointment $appointment): array => [
            'id' => 'appointment-'.$appointment->id,
            'type' => 'appointment',
            'title' => 'Appointment #'.$appointment->id.' · '.($appointment->user?->name ?? 'Patient'),
            'subtitle' => $appointment->appointment_date?->format('M j, Y').' · '.implode(', ', $appointment->service_types ?? []).' · '.str($appointment->status)->replace('_', ' ')->title(),
            'url' => $this->appointmentUrl($user, $appointment),
        ])->all();

        return ['key' => 'appointments', 'title' => 'Appointments and records', 'items' => $items];
    }

    private function peopleGroup(User $user, string $term): ?array
    {
        if (! in_array($user->role, ['admin', 'receptionist', 'company'], true)) {
            return null;
        }

        $query = User::query()->select(['id', 'first_name', 'middle_name', 'last_name', 'email', 'role', 'company_id']);
        if ($user->role === 'company') {
            $query->where('company_id', $user->company_id)->where('role', 'patient');
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

        $items = Company::query()
            ->select(['id', 'company_name', 'email', 'status'])
            ->where(fn (Builder $query) => $query
                ->where('company_name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%"))
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
        $query->where(function (Builder $query) use ($term): void {
            $query->when(ctype_digit($term), fn (Builder $query) => $query->orWhereKey((int) $term))
                ->orWhereHas('user', fn (Builder $patient) => $this->matchUser($patient, $term))
                ->orWhereHas('company', fn (Builder $company) => $company->where('company_name', 'like', "%{$term}%"))
                ->orWhere('status', 'like', "%{$term}%")
                ->orWhere('service_types', 'like', "%{$term}%");
        });
    }

    private function matchUser(Builder $query, string $term): void
    {
        $query->where(fn (Builder $query) => $query
            ->where('first_name', 'like', "%{$term}%")
            ->orWhere('middle_name', 'like', "%{$term}%")
            ->orWhere('last_name', 'like', "%{$term}%")
            ->orWhere('email', 'like', "%{$term}%"));
    }

    private function appointmentUrl(User $user, Appointment $appointment): string
    {
        return match ($user->role) {
            'admin' => route('admin.appointments.show', $appointment),
            'receptionist' => route('receptionist.queue.index', ['search' => $appointment->user?->name]),
            'doctor' => $appointment->status === 'for_final_evaluation'
                ? route('doctor.final-evaluation', $appointment)
                : route('doctor.physical-exams.create', $appointment),
            'medtech' => route('medtech.lab-results.create', $appointment),
            'radtech' => route('radtech.xrays.create', $appointment),
            default => route('appointments.show', $appointment),
        };
    }
}
