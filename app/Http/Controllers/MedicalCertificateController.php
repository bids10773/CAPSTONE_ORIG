<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveMedicalCertificateRequest;
use App\Models\Appointment;
use App\Models\MedicalCertificate;
use App\Models\User;
use App\Services\MedicalCertificateWorkflowService;
use App\Services\MedicalDocumentService;
use App\Support\ClinicHours;
use App\Support\SearchTerm;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class MedicalCertificateController extends Controller
{
    public function __construct(
        private readonly MedicalCertificateWorkflowService $workflow,
        private readonly MedicalDocumentService $documents,
    ) {}

    public function index(Request $request): InertiaResponse
    {
        Gate::authorize('viewAny', MedicalCertificate::class);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(MedicalCertificate::STATUSES)],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'in:10,15,25,50,100'],
        ]);
        $search = SearchTerm::normalize((string) ($filters['search'] ?? ''));
        $likeSearch = SearchTerm::forLike($search);
        $actor = $request->user();

        $certificates = MedicalCertificate::query()
            ->with([
                'patient:id,first_name,middle_name,last_name',
                'attendingPhysician:id,first_name,middle_name,last_name,license_no',
            ])
            ->when($actor->role === 'doctor', fn (Builder $query) => $query
                ->where('attending_physician_id', $actor->id))
            ->when($search !== '', function (Builder $query) use ($search, $likeSearch): void {
                preg_match('/^PAT0*(\d+)$/i', $search, $patientReference);

                $query->where(fn (Builder $match) => $match
                    ->where('certificate_number', 'like', "%{$likeSearch}%")
                    ->orWhere('patient_name', 'like', "%{$likeSearch}%")
                    ->orWhere('patient_reference_code', 'like', "%{$likeSearch}%")
                    ->orWhere('physician_name', 'like', "%{$likeSearch}%")
                    ->orWhere('patient_id', (int) ($patientReference[1] ?? 0)));
            })
            ->when(filled($filters['status'] ?? null), fn (Builder $query) => $query
                ->where('status', $filters['status']))
            ->when(filled($filters['date_from'] ?? null), fn (Builder $query) => $query
                ->whereDate('date_issued', '>=', $filters['date_from']))
            ->when(filled($filters['date_to'] ?? null), fn (Builder $query) => $query
                ->whereDate('date_issued', '<=', $filters['date_to']))
            ->latest('created_at')
            ->latest('id')
            ->paginate((int) ($filters['per_page'] ?? 15))
            ->withQueryString()
            ->through(fn (MedicalCertificate $certificate): array => $this->certificatePayload($certificate, $actor));

        return Inertia::render('medical-certificates/index', [
            'certificates' => $certificates,
            'filters' => [
                'search' => $search,
                'status' => $filters['status'] ?? '',
                'date_from' => $filters['date_from'] ?? '',
                'date_to' => $filters['date_to'] ?? '',
            ],
            'statuses' => MedicalCertificate::STATUSES,
            'can' => [
                'create' => $actor->can('create', MedicalCertificate::class),
            ],
        ]);
    }

    public function create(Request $request): InertiaResponse
    {
        Gate::authorize('create', MedicalCertificate::class);
        $patient = $this->selectedPatient($request);

        return Inertia::render('medical-certificates/create', [
            'certificate' => null,
            'physicians' => $this->physiciansFor($request->user()),
            'selectedPatient' => $patient ? $this->patientPayload($patient) : null,
            'consultations' => $patient ? $this->consultationPayloads($patient, $request->user()) : [],
            'selectedConsultationId' => $request->integer('appointment_id') ?: null,
        ]);
    }

    public function store(SaveMedicalCertificateRequest $request): RedirectResponse
    {
        $certificate = $this->workflow->createDraft($request->user(), $request->validated(), $request);
        $this->documents->synchronizeCertificate($certificate, true);

        return redirect()->route('medical-certificates.show', $certificate)
            ->with('success', "Medical certificate {$certificate->certificate_number} saved as a draft.");
    }

    public function show(Request $request, MedicalCertificate $medicalCertificate): InertiaResponse
    {
        Gate::authorize('view', $medicalCertificate);
        $medicalCertificate->load([
            ...$this->detailRelations(),
            'audits' => fn ($query) => $query->latest('created_at')->latest('id'),
            'audits.actor:id,first_name,middle_name,last_name,role',
        ]);

        return Inertia::render('medical-certificates/show', [
            'certificate' => $this->certificatePayload($medicalCertificate, $request->user(), true),
        ]);
    }

    public function edit(Request $request, MedicalCertificate $medicalCertificate): InertiaResponse
    {
        Gate::authorize('update', $medicalCertificate);
        $medicalCertificate->load($this->detailRelations());
        $patient = $medicalCertificate->patient;

        return Inertia::render('medical-certificates/edit', [
            'certificate' => $this->certificatePayload($medicalCertificate, $request->user()),
            'physicians' => $this->physiciansFor($request->user()),
            'selectedPatient' => $this->patientPayload($patient),
            'consultations' => $this->consultationPayloads($patient, $request->user()),
            'selectedConsultationId' => $medicalCertificate->appointment_id,
        ]);
    }

    public function update(
        SaveMedicalCertificateRequest $request,
        MedicalCertificate $medicalCertificate,
    ): RedirectResponse {
        $certificate = $this->workflow->updateDraft(
            $medicalCertificate,
            $request->user(),
            $request->validated(),
            $request,
        );
        $this->documents->synchronizeCertificate($certificate, true);

        return redirect()->route('medical-certificates.show', $certificate)
            ->with('success', 'Medical certificate draft updated.');
    }

    public function patientSearch(Request $request): JsonResponse
    {
        Gate::authorize('create', MedicalCertificate::class);
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);
        $search = SearchTerm::normalize($validated['q']);
        $likeSearch = SearchTerm::forLike($search);
        preg_match('/^PAT0*(\d+)$/i', $search, $patientReference);

        $patients = User::query()
            ->with('patientProfile')
            ->where('role', 'patient')
            ->where('is_active', true)
            ->when($request->user()->role === 'doctor', fn (Builder $query) => $this
                ->scopePatientsForDoctor($query, $request->user()))
            ->where(fn (Builder $query) => $query
                ->where('id', (int) ($patientReference[1] ?? 0))
                ->orWhere('first_name', 'like', "%{$likeSearch}%")
                ->orWhere('middle_name', 'like', "%{$likeSearch}%")
                ->orWhere('last_name', 'like', "%{$likeSearch}%")
                ->orWhere('email', 'like', "%{$likeSearch}%")
                ->orWhere('contact', 'like', "%{$likeSearch}%")
                ->orWhereHas('patientProfile', fn (Builder $profile) => $profile
                    ->where('employee_number', 'like', "%{$likeSearch}%")))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(15)
            ->get()
            ->map(fn (User $patient): array => $this->patientPayload($patient))
            ->values();

        return response()->json(['patients' => $patients])
            ->withHeaders($this->privateDocumentHeaders());
    }

    public function consultations(Request $request, User $patient): JsonResponse
    {
        Gate::authorize('create', MedicalCertificate::class);
        abort_unless($patient->role === 'patient', 404);
        $patient->loadMissing('patientProfile');

        $consultations = $this->consultationPayloads($patient, $request->user());
        if ($request->user()->role === 'doctor' && $consultations === []) {
            abort(404);
        }

        return response()->json(['consultations' => $consultations])
            ->withHeaders($this->privateDocumentHeaders());
    }

    public function submit(Request $request, MedicalCertificate $medicalCertificate): RedirectResponse
    {
        Gate::authorize('submit', $medicalCertificate);
        $this->workflow->submitForApproval($medicalCertificate, $request->user(), $request);
        $this->documents->synchronizeCertificate($medicalCertificate->refresh(), true);

        return back()->with('success', 'Medical certificate submitted to the attending physician.');
    }

    public function approve(Request $request, MedicalCertificate $medicalCertificate): RedirectResponse
    {
        Gate::authorize('approve', $medicalCertificate);
        $validated = $request->validate([
            'approval_notes' => ['nullable', 'string', 'max:1500'],
            'notes' => ['nullable', 'string', 'max:1500'],
        ]);
        $this->workflow->approve(
            $medicalCertificate,
            $request->user(),
            $validated['approval_notes'] ?? $validated['notes'] ?? null,
            $request,
        );
        $this->documents->synchronizeCertificate($medicalCertificate->refresh(), true);

        return back()->with('success', 'Medical certificate approved.');
    }

    public function requestChanges(Request $request, MedicalCertificate $medicalCertificate): RedirectResponse
    {
        Gate::authorize('requestChanges', $medicalCertificate);
        $validated = $request->validate([
            'reason' => ['nullable', 'required_without:change_request_reason', 'string', 'max:1500'],
            'change_request_reason' => ['nullable', 'required_without:reason', 'string', 'max:1500'],
        ]);
        $this->workflow->requestChanges(
            $medicalCertificate,
            $request->user(),
            $validated['reason'] ?? $validated['change_request_reason'],
            $request,
        );
        $this->documents->synchronizeCertificate($medicalCertificate->refresh(), true);

        return back()->with('success', 'The certificate was returned for correction.');
    }

    public function issue(Request $request, MedicalCertificate $medicalCertificate): RedirectResponse
    {
        Gate::authorize('issue', $medicalCertificate);
        $validated = $request->validate([
            'date_issued' => ['nullable', 'date', 'before_or_equal:'.ClinicHours::today()],
        ]);
        $this->workflow->issue(
            $medicalCertificate,
            $request->user(),
            $validated['date_issued'] ?? null,
            $request,
        );
        $this->documents->synchronizeCertificate($medicalCertificate->refresh(), true);

        return back()->with('success', 'Medical certificate issued and locked.');
    }

    public function void(Request $request, MedicalCertificate $medicalCertificate): RedirectResponse
    {
        Gate::authorize('void', $medicalCertificate);
        $validated = $request->validate([
            'reason' => ['nullable', 'required_without:void_reason', 'string', 'max:1500'],
            'void_reason' => ['nullable', 'required_without:reason', 'string', 'max:1500'],
        ]);
        $this->workflow->void(
            $medicalCertificate,
            $request->user(),
            $validated['reason'] ?? $validated['void_reason'],
            $request,
        );
        $this->documents->synchronizeCertificate($medicalCertificate->refresh(), true);

        return back()->with('success', 'Medical certificate voided. The record and audit history were preserved.');
    }

    public function print(Request $request, MedicalCertificate $medicalCertificate): HttpResponse
    {
        Gate::authorize('print', $medicalCertificate);
        $medicalCertificate->load($this->documentRelations());
        $this->workflow->auditDocumentAccess($medicalCertificate, $request->user(), 'printed', $request);

        return response()
            ->view('medical-certificates.print', ['certificate' => $medicalCertificate])
            ->withHeaders($this->privateDocumentHeaders());
    }

    public function pdf(Request $request, MedicalCertificate $medicalCertificate): HttpResponse
    {
        Gate::authorize('downloadPdf', $medicalCertificate);
        $medicalCertificate->load($this->documentRelations());
        $this->workflow->auditDocumentAccess($medicalCertificate, $request->user(), 'pdf_downloaded', $request);

        $response = Pdf::loadView('pdf.medical-certificate', [
            'certificate' => $medicalCertificate,
        ])->setPaper('a4', 'portrait')
            ->download("{$medicalCertificate->certificate_number}.pdf");

        foreach ($this->privateDocumentHeaders() as $header => $value) {
            $response->headers->set($header, $value);
        }

        return $response;
    }

    private function selectedPatient(Request $request): ?User
    {
        $patientId = $request->integer('patient_id');
        if (! $patientId) {
            return null;
        }

        $patient = User::query()
            ->with('patientProfile')
            ->whereKey($patientId)
            ->where('role', 'patient')
            ->first();

        if (! $patient) {
            return null;
        }

        if ($request->user()->role === 'doctor') {
            $visible = User::query()
                ->whereKey($patient->id)
                ->where(fn (Builder $query) => $this->scopePatientsForDoctor($query, $request->user()))
                ->exists();

            return $visible ? $patient : null;
        }

        return $patient;
    }

    private function physiciansFor(User $actor): array
    {
        return User::query()
            ->where('role', 'doctor')
            ->where('is_active', true)
            ->when($actor->role === 'doctor', fn (Builder $query) => $query->whereKey($actor->id))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'license_no', 'license_verification_status'])
            ->map(fn (User $doctor): array => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'license_no' => $doctor->license_no,
                'license_verification_status' => $doctor->license_verification_status,
            ])->values()->all();
    }

    private function patientPayload(User $patient): array
    {
        $patient->loadMissing('patientProfile');
        $profile = $patient->patientProfile;

        return [
            'id' => $patient->id,
            'patient_reference_code' => $patient->patient_reference_code,
            'name' => $patient->name,
            'full_name' => $patient->name,
            'first_name' => $patient->first_name,
            'middle_name' => $patient->middle_name,
            'last_name' => $patient->last_name,
            'birthdate' => $profile?->birthdate?->toDateString(),
            'age' => $profile?->birthdate?->age,
            'sex' => $profile?->sex ?: $patient->sex,
            'civil_status' => $profile?->civil_status,
        ];
    }

    private function consultationPayloads(User $patient, User $actor): array
    {
        return Appointment::query()
            ->with([
                'doctor:id,first_name,middle_name,last_name,license_no',
                'medicalHistory:id,appointment_id,present_illness',
                'medicalExamination:id,appointment_id,examining_doctor_id,finalized_by,final_diagnosis,recommendations',
                'medicalExamination.examiningDoctor:id,first_name,middle_name,last_name,license_no',
            ])
            ->where('user_id', $patient->id)
            ->where(fn (Builder $query) => $query
                ->where('type', '!=', 'company_bulk')
                ->orWhereNotNull('bulk_appointment_id'))
            ->when($actor->role === 'doctor', fn (Builder $query) => $query
                ->where(fn (Builder $assigned) => $assigned
                    ->where('doctor_id', $actor->id)
                    ->orWhereHas('medicalExamination', fn (Builder $exam) => $exam
                        ->where('examining_doctor_id', $actor->id)
                        ->orWhere('finalized_by', $actor->id))
                    ->orWhereHas('serviceQueues', fn (Builder $queue) => $queue
                        ->where('assigned_staff_id', $actor->id)
                        ->whereIn('service_role', ['doctor', 'drug_verification', 'final_evaluation']))))
            ->latest('appointment_date')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(function (Appointment $appointment): array {
                $physician = $appointment->medicalExamination?->examiningDoctor ?: $appointment->doctor;

                return [
                    'id' => $appointment->id,
                    'reference_code' => $appointment->reference_code,
                    'consultation_date' => $appointment->appointment_date?->toDateString(),
                    'status' => $appointment->status,
                    'reason_for_consultation' => $appointment->medicalHistory?->present_illness
                        ?: $appointment->notes,
                    'clinical_impression' => $appointment->medicalExamination?->final_diagnosis,
                    'recommendation' => $appointment->medicalExamination?->recommendations,
                    'attending_physician_id' => $physician?->id,
                    'attending_physician_name' => $physician?->name,
                    'physician_license_no' => $physician?->license_no,
                ];
            })->values()->all();
    }

    private function scopePatientsForDoctor(Builder $query, User $doctor): Builder
    {
        return $query->whereHas('appointments', fn (Builder $appointments) => $appointments
            ->where('doctor_id', $doctor->id)
            ->orWhereHas('medicalExamination', fn (Builder $exam) => $exam
                ->where('examining_doctor_id', $doctor->id)
                ->orWhere('finalized_by', $doctor->id))
            ->orWhereHas('serviceQueues', fn (Builder $queue) => $queue
                ->where('assigned_staff_id', $doctor->id)
                ->whereIn('service_role', ['doctor', 'drug_verification', 'final_evaluation'])));
    }

    private function certificatePayload(
        MedicalCertificate $certificate,
        User $actor,
        bool $includeAudits = false,
    ): array {
        $payload = [
            'id' => $certificate->id,
            'certificate_number' => $certificate->certificate_number,
            'patient_id' => $certificate->patient_id,
            'appointment_id' => $certificate->appointment_id,
            'attending_physician_id' => $certificate->attending_physician_id,
            'salutation' => $certificate->salutation,
            'patient_name' => $certificate->patient_name,
            'patient_reference_code' => $certificate->patient_reference_code,
            'patient_age' => $certificate->patient_age,
            'patient_sex' => $certificate->patient_sex,
            'patient_civil_status' => $certificate->patient_civil_status,
            'consultation_date' => $certificate->consultation_date?->toDateString(),
            'reason_for_consultation' => $certificate->reason_for_consultation,
            'clinical_impression' => $certificate->clinical_impression,
            'recommendation' => $certificate->recommendation,
            'rest_start_date' => $certificate->rest_start_date?->toDateString(),
            'rest_end_date' => $certificate->rest_end_date?->toDateString(),
            'date_issued' => $certificate->date_issued?->toDateString(),
            'physician_name' => $certificate->physician_name,
            'physician_license_no' => $certificate->physician_license_no,
            'status' => $certificate->status,
            'approval_notes' => $certificate->approval_notes,
            'change_request_reason' => $certificate->change_request_reason,
            'correction_notes' => $certificate->change_request_reason,
            'void_reason' => $certificate->void_reason,
            'submitted_at' => $certificate->submitted_at?->toIso8601String(),
            'approved_at' => $certificate->approved_at?->toIso8601String(),
            'issued_at' => $certificate->issued_at?->toIso8601String(),
            'voided_at' => $certificate->voided_at?->toIso8601String(),
            'created_at' => $certificate->created_at?->toIso8601String(),
            'updated_at' => $certificate->updated_at?->toIso8601String(),
            'patient' => $certificate->relationLoaded('patient') && $certificate->patient ? [
                'id' => $certificate->patient->id,
                'name' => $certificate->patient->name,
                'patient_reference_code' => $certificate->patient->patient_reference_code,
            ] : [
                'id' => $certificate->patient_id,
                'name' => $certificate->patient_name,
                'patient_reference_code' => $certificate->patient_reference_code,
            ],
            'attending_physician' => $certificate->relationLoaded('attendingPhysician') && $certificate->attendingPhysician ? [
                'id' => $certificate->attendingPhysician->id,
                'name' => $certificate->attendingPhysician->name,
                'license_no' => $certificate->attendingPhysician->license_no,
            ] : [
                'id' => $certificate->attending_physician_id,
                'name' => $certificate->physician_name,
                'license_no' => $certificate->physician_license_no,
            ],
            'can' => [
                'view' => $actor->can('view', $certificate),
                'edit' => $actor->can('update', $certificate),
                'submit' => $actor->can('submit', $certificate),
                'approve' => $actor->can('approve', $certificate),
                'request_changes' => $actor->can('requestChanges', $certificate),
                'issue' => $actor->can('issue', $certificate),
                'void' => $actor->can('void', $certificate),
                'print' => $actor->can('print', $certificate),
                'download_pdf' => $actor->can('downloadPdf', $certificate),
            ],
        ];

        if ($includeAudits) {
            $payload['audits'] = $certificate->audits->map(fn ($audit): array => [
                'id' => $audit->id,
                'action' => $audit->action,
                'old_status' => $audit->old_status,
                'new_status' => $audit->new_status,
                'from_status' => $audit->old_status,
                'to_status' => $audit->new_status,
                'notes' => $audit->changes['reason'] ?? $audit->changes['approval_notes'] ?? null,
                'changes' => $audit->changes,
                'actor' => $audit->actor ? [
                    'id' => $audit->actor->id,
                    'name' => $audit->actor->name,
                    'role' => $audit->actor->role,
                ] : null,
                'created_at' => $audit->created_at?->toIso8601String(),
            ])->values()->all();
        }

        return $payload;
    }

    private function detailRelations(): array
    {
        return [
            'patient.patientProfile',
            'appointment',
            'attendingPhysician',
            'creator',
            'approver',
            'issuer',
            'voider',
        ];
    }

    private function documentRelations(): array
    {
        return [
            'patient.patientProfile',
            'appointment',
            'attendingPhysician',
            'approver',
            'issuer',
        ];
    }

    private function privateDocumentHeaders(): array
    {
        return [
            'Cache-Control' => 'private, no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'X-Robots-Tag' => 'noindex, nofollow, noarchive, nosnippet',
        ];
    }
}
