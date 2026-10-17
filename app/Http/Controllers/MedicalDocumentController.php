<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\MedicalDocument;
use App\Services\MedicalDocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MedicalDocumentController extends Controller
{
    public function patientIndex(Request $request, MedicalDocumentService $service): Response
    {
        abort_unless($request->user()->role === 'patient', 403);
        $service->synchronizePatient($request->user());

        $appointmentId = $request->integer('appointment');
        $selectedAppointment = $appointmentId > 0
            ? Appointment::query()
                ->where('user_id', $request->user()->id)
                ->findOrFail($appointmentId)
            : null;

        $documents = MedicalDocument::query()
            ->releaseVisible()
            ->where('patient_id', $request->user()->id)
            ->with('appointment:id,reference_code,appointment_date,start_time,status')
            ->when(
                $selectedAppointment,
                fn ($query, Appointment $appointment) => $query->where('appointment_id', $appointment->id)
            )
            ->orderByDesc(
                Appointment::query()
                    ->select('appointment_date')
                    ->whereColumn('appointments.id', 'medical_documents.appointment_id')
            )
            ->latest('requested_at')
            ->latest('id')
            ->get()
            ->map(fn (MedicalDocument $document) => $this->patientPayload($document));

        return Inertia::render('medical-documents/patient', [
            'documents' => $documents,
            'selectedAppointment' => $selectedAppointment ? [
                'id' => $selectedAppointment->id,
                'reference_code' => $selectedAppointment->reference_code,
                'appointment_date' => $selectedAppointment->appointment_date?->toDateString(),
                'start_time' => $selectedAppointment->start_time,
                'status' => $selectedAppointment->status,
            ] : null,
            'releaseInstructions' => config('medical.document_release.instructions'),
        ]);
    }

    public function index(Request $request, MedicalDocumentService $service): Response
    {
        Gate::authorize('viewAny', MedicalDocument::class);
        abort_if($request->user()->role === 'patient', 403);
        $service->synchronizeAll();
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(MedicalDocument::STATUSES)],
            'type' => ['nullable', Rule::in(MedicalDocument::TYPES)],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);
        $search = trim((string) ($filters['search'] ?? ''));

        $documents = MedicalDocument::query()->visibleTo($request->user())
            ->with(['patient:id,first_name,middle_name,last_name', 'appointment:id,service_types', 'medicalCertificate',
                'releases' => fn ($query) => $query->with(['releasedBy:id,first_name,middle_name,last_name', 'reversedBy:id,first_name,middle_name,last_name'])->latest('released_at')])
            ->when($search, fn ($query) => $query->where(fn ($nested) => $nested
                ->where('document_number', 'like', "%{$search}%")
                ->orWhereHas('patient', fn ($patient) => $patient->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%"))))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['type'] ?? null, fn ($query, $type) => $query->where('document_type', $type))
            ->when($filters['date_from'] ?? null, fn ($query, $date) => $query->whereDate('requested_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($query, $date) => $query->whereDate('requested_at', '<=', $date))
            ->latest('requested_at')->paginate(20)->withQueryString();

        $documents->through(fn (MedicalDocument $document) => $this->staffPayload($document, $request));

        return Inertia::render('medical-documents/index', [
            'documents' => $documents,
            'filters' => $filters,
            'releaseMethods' => config('medical.document_release.methods'),
            'releaseInstructions' => config('medical.document_release.instructions'),
        ]);
    }

    public function markReady(Request $request, MedicalDocument $medicalDocument, MedicalDocumentService $service): RedirectResponse
    {
        Gate::authorize('markReady', $medicalDocument);
        $service->markReady($medicalDocument, $request->user(), $request);

        return back()->with('success', 'Document marked ready for pickup.');
    }

    public function review(Request $request, MedicalDocument $medicalDocument): RedirectResponse
    {
        Gate::authorize('view', $medicalDocument);
        abort_unless(in_array($request->user()->role, ['admin', 'receptionist'], true), 403);
        abort_unless($medicalDocument->status === 'approved', 422, 'Only approved documents can be reviewed for release.');

        $medicalDocument->audits()->firstOrCreate([
            'actor_id' => $request->user()->id,
            'action' => 'reviewed',
        ], [
            'old_status' => $medicalDocument->status,
            'new_status' => $medicalDocument->status,
            'metadata' => ['reviewed_for_release' => true],
            'ip_address' => $request->ip(),
            'user_agent' => str($request->userAgent())->limit(1000),
        ]);

        return back()->with('success', 'Report review recorded. You may now mark it ready.');
    }

    public function release(Request $request, MedicalDocument $medicalDocument, MedicalDocumentService $service): RedirectResponse
    {
        Gate::authorize('release', $medicalDocument);
        $data = $request->validate([
            'recipient_type' => ['required', Rule::in(['patient', 'authorized_representative'])],
            'recipient_name' => ['nullable', 'required_if:recipient_type,authorized_representative', 'string', 'max:255'],
            'representative_verification' => ['nullable', 'required_if:recipient_type,authorized_representative', 'string', 'max:1000'],
            'release_method' => ['required', Rule::in(array_keys(config('medical.document_release.methods')))],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);
        $service->release($medicalDocument, $request->user(), $data, $request);

        return back()->with('success', 'Document release recorded.');
    }

    public function reverseRelease(Request $request, MedicalDocument $medicalDocument, MedicalDocumentService $service): RedirectResponse
    {
        Gate::authorize('reverseRelease', $medicalDocument);
        $data = $request->validate(['reason' => ['required', 'string', 'max:1000']]);
        $service->reverseRelease($medicalDocument, $request->user(), $data['reason'], $request);

        return back()->with('success', 'Release reversed with an audit record.');
    }

    private function patientPayload(MedicalDocument $document): array
    {
        return ['id' => $document->id, 'document_number' => $document->document_number,
            'document_type' => $document->document_type, 'title' => $document->title,
            'related_service' => $document->related_service, 'status' => $document->status,
            'requested_at' => $document->requested_at?->toIso8601String(), 'ready_at' => $document->ready_at?->toIso8601String(),
            'released_at' => $document->released_at?->toIso8601String(), 'release_instructions' => $document->release_instructions,
            'appointment' => $document->appointment ? [
                'id' => $document->appointment->id,
                'reference_code' => $document->appointment->reference_code,
                'appointment_date' => $document->appointment->appointment_date?->toDateString(),
                'start_time' => $document->appointment->start_time,
                'status' => $document->appointment->status,
            ] : null];
    }

    private function staffPayload(MedicalDocument $document, Request $request): array
    {
        $isPeBundle = $document->appointment?->isPePackage() ?? false;
        $isPeBundleRoot = $isPeBundle && $document->document_type === 'physical_examination';
        $isPeBundleChild = $isPeBundle && in_array($document->document_type, ['laboratory_report', 'xray_report'], true);
        $reviewedByUser = $document->audits()
            ->where('action', 'reviewed')
            ->where('actor_id', $request->user()->id)
            ->exists();
        $pdfUrl = null;
        if ($document->medicalCertificate && $request->user()->can('downloadPdf', $document->medicalCertificate)) {
            $pdfUrl = route('medical-certificates.pdf', $document->medicalCertificate);
        } elseif ($document->appointment_id) {
            $ability = match ($document->document_type) {
                'physical_examination' => 'viewPhysicalExam', 'laboratory_report' => 'viewLaboratory', 'xray_report' => 'viewXray', default => null
            };
            $route = match ($document->document_type) {
                'physical_examination' => 'clinical-forms.physical-exam.pdf', 'laboratory_report' => 'clinical-forms.laboratory.pdf', 'xray_report' => 'clinical-forms.xray.pdf', default => null
            };
            if ($ability && $route && $request->user()->can($ability, $document->appointment)) {
                $pdfUrl = route($route, $document->appointment_id);
            }
        }

        return [...$this->patientPayload($document), 'patient' => ['id' => $document->patient_id, 'name' => $document->patient?->name],
            'pdf_url' => $pdfUrl, 'can' => [
                'mark_ready' => ! $isPeBundleChild && $request->user()->can('markReady', $document),
                'release' => ! $isPeBundleChild && $request->user()->can('release', $document),
                'reverse' => ! $isPeBundleChild && $request->user()->can('reverseRelease', $document),
                'grouped_pe_release' => $isPeBundleRoot,
                'review' => ! $isPeBundleChild
                    && in_array($request->user()->role, ['admin', 'receptionist'], true)
                    && $document->status === 'approved'
                    && $pdfUrl !== null,
                'reviewed' => $reviewedByUser,
            ],
            'releases' => $document->releases->map(fn ($release) => ['id' => $release->id, 'recipient_type' => $release->recipient_type,
                'recipient_name' => $release->recipient_name, 'representative_verification' => $release->representative_verification,
                'release_method' => $release->release_method, 'remarks' => $release->remarks, 'released_at' => $release->released_at?->toIso8601String(),
                'released_by' => $release->releasedBy?->name, 'reversed_at' => $release->reversed_at?->toIso8601String(),
                'reversed_by' => $release->reversedBy?->name, 'reversal_reason' => $release->reversal_reason])->values()];
    }
}
