<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use App\Support\SearchTerm;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffPatientRecordController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $staff */
        $staff = $request->user();
        abort_unless(in_array($staff->role, ['doctor', 'medtech', 'radtech', 'receptionist'], true), 403);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:40'],
            'per_page' => ['nullable', 'integer', 'in:10,15,25,50,100'],
        ]);
        $search = SearchTerm::normalize((string) ($filters['search'] ?? ''));
        $likeSearch = SearchTerm::forLike($search);
        $status = (string) ($filters['status'] ?? '');

        $records = Appointment::query()
            ->with([
                'user:id,first_name,middle_name,last_name,email,contact',
                'user.patientProfile:user_id,birthdate,sex,civil_status,employee_number',
                'company:id,company_name',
                'physicalExam:id,appointment_id',
                'medicalHistory:id,appointment_id',
                'medicalExamination:id,appointment_id,examining_doctor_id,finalized_by,finalized_at,released_at',
                'labResult:id,appointment_id,encoded_by,status,finalized_at',
                'xrayReport:id,appointment_id,radiologist_id,status,is_completed,verified_at',
            ])
            ->where('type', '!=', 'company_bulk')
            ->whereHas('user', fn (Builder $query) => $query->where('role', 'patient'))
            ->when($staff->role !== 'receptionist', fn (Builder $query) => $query
                ->where(fn (Builder $assigned) => $this->scopeAssignedRecords($assigned, $staff)))
            ->when($search, fn (Builder $query) => $query->where(fn (Builder $match) => $match
                ->where('id', ctype_digit($search) ? (int) $search : 0)
                ->orWhereHas('user', fn (Builder $user) => $user
                    ->where('first_name', 'like', "%{$likeSearch}%")
                    ->orWhere('middle_name', 'like', "%{$likeSearch}%")
                    ->orWhere('last_name', 'like', "%{$likeSearch}%")
                    ->orWhere('email', 'like', "%{$likeSearch}%")
                    ->orWhere('contact', 'like', "%{$likeSearch}%"))
                ->orWhereHas('patientProfile', fn (Builder $profile) => $profile
                    ->where('employee_number', 'like', "%{$likeSearch}%"))))
            ->when($status, fn (Builder $query) => $query->where('status', $status))
            ->latest('appointment_date')
            ->latest('id')
            ->paginate((int) ($filters['per_page'] ?? 15))
            ->withQueryString()
            ->through(fn (Appointment $appointment): array => $this->recordPayload($appointment, $staff->role));

        return Inertia::render('staff/patient-records/index', [
            'records' => $records,
            'filters' => ['search' => $search, 'status' => $status],
            'role' => $staff->role,
        ]);
    }

    private function scopeAssignedRecords(Builder $query, User $staff): void
    {
        if ($staff->role === 'doctor') {
            $query->where('doctor_id', $staff->id)
                ->orWhereHas('serviceQueues', fn (Builder $queue) => $queue
                    ->where('assigned_staff_id', $staff->id)
                    ->whereIn('service_role', ['doctor', 'drug_verification', 'final_evaluation']))
                ->orWhereHas('medicalExamination', fn (Builder $exam) => $exam
                    ->where('examining_doctor_id', $staff->id)
                    ->orWhere('finalized_by', $staff->id));

            return;
        }

        if ($staff->role === 'medtech') {
            $query->whereHas('labResult', fn (Builder $lab) => $lab->where('encoded_by', $staff->id))
                ->orWhereHas('serviceQueues', fn (Builder $queue) => $queue
                    ->where('assigned_staff_id', $staff->id)
                    ->where('service_role', 'medtech'))
                ->orWhere(fn (Builder $available) => $available
                    ->whereNull('bulk_appointment_id')
                    ->whereIn('status', ['for_diagnostics', 'verifying_drug_test']));

            return;
        }

        $query->whereHas('xrayReport', fn (Builder $xray) => $xray->where('radiologist_id', $staff->id))
            ->orWhereHas('serviceQueues', fn (Builder $queue) => $queue
                ->where('assigned_staff_id', $staff->id)
                ->where('service_role', 'radtech'))
            ->orWhere(fn (Builder $available) => $available
                ->whereNull('bulk_appointment_id')
                ->whereIn('status', ['for_xray', 'awaiting_xray_result', 'verifying_xray']));
    }

    private function recordPayload(Appointment $appointment, string $role): array
    {
        $profile = $appointment->user->patientProfile;
        $manageUrl = match ($role) {
            'doctor' => $appointment->status === 'for_final_evaluation'
                ? route('doctor.final-evaluation', $appointment, false)
                : (in_array($appointment->status, ['accepted', 'arrived'], true)
                    && $appointment->appointment_date?->isToday()
                    && $appointment->isPePackage()
                    ? route('doctor.physical-exams.create', $appointment, false)
                    : null),
            'medtech' => in_array($appointment->status, ['for_diagnostics', 'verifying_drug_test'], true)
                ? route('medtech.lab-results.create', $appointment, false)
                : null,
            'radtech' => in_array($appointment->status, ['for_xray', 'awaiting_xray_result', 'verifying_xray'], true)
                ? route('radtech.xrays.create', $appointment, false)
                : null,
            default => null,
        };

        return [
            'id' => $appointment->id,
            'reference_code' => $appointment->reference_code,
            'appointment_date' => $appointment->appointment_date?->toDateString(),
            'status' => $appointment->status,
            'type' => $appointment->type,
            'service_types' => $appointment->service_types ?? [],
            'patient' => [
                'name' => $appointment->user->name,
                'email' => $appointment->user->email,
                'contact' => $appointment->user->contact,
                'birthdate' => $profile?->birthdate?->toDateString(),
                'age' => $profile?->birthdate?->age,
                'sex' => $profile?->sex,
                'civil_status' => $profile?->civil_status,
                'employee_number' => $profile?->employee_number,
            ],
            'company' => $appointment->company?->company_name ?? $appointment->company_name,
            'documents' => [
                'physical_exam' => $role === 'doctor' && $appointment->physicalExam !== null,
                'medical_history' => $role === 'doctor' && $appointment->physicalExam !== null && $appointment->medicalHistory !== null,
                'final_evaluation' => $role === 'doctor' && $appointment->physicalExam !== null && $appointment->medicalExamination?->finalized_at !== null,
                'laboratory' => in_array($role, ['doctor', 'medtech'], true) && $appointment->labResult !== null,
                'xray' => in_array($role, ['doctor', 'radtech'], true) && $appointment->xrayReport !== null,
            ],
            'manage_url' => $manageUrl,
        ];
    }
}
