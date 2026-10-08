<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use App\Services\LaboratoryFormDefinition;
use App\Support\SearchTerm;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffPatientRecordController extends Controller
{
    public function __construct(private readonly LaboratoryFormDefinition $laboratoryForms) {}

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

        $records = $this->recordsQuery($staff)
            ->when($search, function (Builder $query) use ($search, $likeSearch): void {
                $appointmentReference = Appointment::parseReferenceCode($search);
                preg_match('/^PAT0*(\d+)$/i', $search, $patientMatch);

                $query->where(fn (Builder $match) => $match
                    ->where(fn (Builder $appointment) => $appointment
                        ->where('id', ctype_digit($search)
                            ? (int) $search
                            : (int) ($appointmentReference['id'] ?? 0))
                        ->when($appointmentReference, fn (Builder $reference) => $reference
                            ->whereIn('type', $appointmentReference['types'])))
                    ->orWhereHas('user', fn (Builder $user) => $user
                        ->where('id', (int) ($patientMatch[1] ?? 0))
                        ->orWhere('first_name', 'like', "%{$likeSearch}%")
                        ->orWhere('middle_name', 'like', "%{$likeSearch}%")
                        ->orWhere('last_name', 'like', "%{$likeSearch}%")
                        ->orWhere('email', 'like', "%{$likeSearch}%")
                        ->orWhere('contact', 'like', "%{$likeSearch}%"))
                    ->orWhereHas('patientProfile', fn (Builder $profile) => $profile
                        ->where('employee_number', 'like', "%{$likeSearch}%")));
            })
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

    public function show(Request $request, User $patient): Response
    {
        /** @var User $staff */
        $staff = $request->user();
        abort_unless(
            in_array($staff->role, ['doctor', 'medtech', 'radtech', 'receptionist'], true)
                && $patient->role === 'patient',
            404,
        );

        $appointments = $this->recordsQuery($staff)
            ->where('user_id', $patient->id)
            ->latest('appointment_date')
            ->latest('id')
            ->get();

        abort_if($appointments->isEmpty(), 404);

        $patient->load('patientProfile', 'company:id,company_name');
        $profile = $patient->patientProfile;

        return Inertia::render('staff/patient-records/show', [
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'patient_reference_code' => $patient->patient_reference_code,
                'email' => $patient->email,
                'contact' => $patient->contact,
                'company' => $patient->company?->company_name,
                'profile' => $profile ? [
                    'birthdate' => $profile->birthdate?->toDateString(),
                    'age' => $profile->birthdate?->age,
                    'sex' => $profile->sex,
                    'civil_status' => $profile->civil_status,
                    'address' => $profile->address,
                    'employee_number' => $profile->employee_number,
                ] : null,
            ],
            'records' => $appointments
                ->map(fn (Appointment $appointment): array => $this->recordPayload($appointment, $staff->role))
                ->values(),
            'role' => $staff->role,
        ]);
    }

    private function recordsQuery(User $staff): Builder
    {
        return Appointment::query()
            ->with([
                'user:id,first_name,middle_name,last_name,email,contact,role',
                'user.patientProfile:user_id,birthdate,sex,civil_status,address,employee_number',
                'company:id,company_name',
                'physicalExam',
                'medicalHistory:id,appointment_id',
                'medicalExamination',
                'labResult',
                'xrayReport',
            ])
            ->where('type', '!=', 'company_bulk')
            ->whereHas('user', fn (Builder $query) => $query->where('role', 'patient'))
            ->when($staff->role !== 'receptionist', fn (Builder $query) => $query
                ->where(fn (Builder $assigned) => $this->scopeAssignedRecords($assigned, $staff)));
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
                : (($appointment->status === 'arrived' || $appointment->arrived_at !== null)
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
                'id' => $appointment->user->id,
                'name' => $appointment->user->name,
                'patient_reference_code' => $appointment->user->patient_reference_code,
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
                'laboratory' => in_array($role, ['doctor', 'medtech'], true) && $appointment->labResult !== null,
                'xray' => in_array($role, ['doctor', 'radtech'], true) && $appointment->xrayReport !== null,
            ],
            'reports' => [
                'physical_exam' => $role === 'doctor' && $appointment->physicalExam ? [
                    'classification' => $appointment->medicalExamination?->medical_classification
                        ?? $appointment->physicalExam->classification,
                    'remarks' => $appointment->medicalExamination?->final_remarks
                        ?? $appointment->physicalExam->doctor_remarks
                        ?? $appointment->physicalExam->remarks,
                    'url' => route('clinical-forms.physical-exam.pdf', $appointment, false),
                ] : null,
                'laboratory' => in_array($role, ['doctor', 'medtech'], true) && $appointment->labResult ? [
                    'status' => $appointment->labResult->status,
                    'sections' => collect($this->laboratoryForms->sectionsFor($appointment))
                        ->filter(fn (array $definition): bool => filled($appointment->labResult->{$definition['column']}))
                        ->pluck('label')
                        ->values()
                        ->all(),
                    'url' => route('clinical-forms.laboratory.pdf', $appointment, false),
                ] : null,
                'xray' => in_array($role, ['doctor', 'radtech'], true) && $appointment->xrayReport ? [
                    'status' => $appointment->xrayReport->status,
                    'impression' => $appointment->xrayReport->impression,
                    'url' => route('clinical-forms.xray.pdf', $appointment, false),
                ] : null,
            ],
            'manage_url' => $manageUrl,
        ];
    }
}
