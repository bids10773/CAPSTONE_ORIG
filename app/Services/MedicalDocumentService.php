<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\MedicalCertificate;
use App\Models\MedicalDocument;
use App\Models\User;
use App\Notifications\MedicalDocumentStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MedicalDocumentService
{
    public function synchronizePatient(User $patient): void
    {
        Appointment::query()->where('user_id', $patient->id)->with([
            'physicalExam', 'labResult', 'xrayReport', 'medicalExamination',
        ])->each(fn (Appointment $appointment) => $this->synchronizeAppointment($appointment));

        MedicalCertificate::query()->where('patient_id', $patient->id)
            ->each(fn (MedicalCertificate $certificate) => $this->synchronizeCertificate($certificate));
    }

    public function synchronizeAll(): void
    {
        Appointment::query()->with(['physicalExam', 'labResult', 'xrayReport', 'medicalExamination'])
            ->chunkById(100, fn ($appointments) => $appointments->each(
                fn (Appointment $appointment) => $this->synchronizeAppointment($appointment)
            ));
        MedicalCertificate::query()->chunkById(100, fn ($certificates) => $certificates->each(
            fn (MedicalCertificate $certificate) => $this->synchronizeCertificate($certificate)
        ));
    }

    public function synchronizeAppointment(Appointment $appointment): void
    {
        if ($appointment->isPePackage()) {
            $this->upsert($appointment, 'physical_examination', 'Complete Medical Examination Report', 'Medical Examination',
                $appointment->medicalExamination?->finalized_at ? 'approved' : ($appointment->physicalExam ? 'for_review' : 'pending'));

            return;
        }
        if ($appointment->requiresPhysicalExamination() && $appointment->examination_purpose !== 'medical_clearance') {
            $this->upsert($appointment, 'physical_examination', 'Physical Examination Report', 'Physical Examination',
                $appointment->medicalExamination?->finalized_at ? 'approved' : ($appointment->physicalExam ? 'for_review' : 'pending'));
        }
        $laboratorySections = app(LaboratoryFormDefinition::class)->sectionsFor($appointment);
        if ($laboratorySections !== []) {
            $laboratoryServices = collect($appointment->service_types ?? [])
                ->filter(fn (string $service): bool => collect($laboratorySections)
                    ->contains(fn (array $section): bool => in_array($service, $section['services'], true)))
                ->unique()
                ->implode(', ');
            $this->upsert($appointment, 'laboratory_report', 'Laboratory Report', $laboratoryServices,
                $appointment->labResult?->isFinalized() ? 'approved' : ($appointment->labResult ? 'for_review' : 'pending'));
        }
        if ($appointment->requiresXray()) {
            $this->upsert($appointment, 'xray_report', 'Chest X-Ray Report', 'X-Ray',
                $appointment->xrayReport?->isVerified() ? 'approved' : ($appointment->xrayReport ? 'for_review' : 'pending'));
        }
    }

    public function synchronizeCertificate(MedicalCertificate $certificate, bool $notify = false): MedicalDocument
    {
        $status = match ($certificate->status) {
            'pending_approval' => 'for_review',
            'approved', 'issued' => 'approved',
            'void' => 'voided',
            default => 'pending',
        };

        return $this->saveSource([
            'source_key' => "certificate:{$certificate->id}",
            'source_type' => 'medical_certificate',
            'source_id' => $certificate->id,
            'patient_id' => $certificate->patient_id,
            'appointment_id' => $certificate->appointment_id,
            'medical_certificate_id' => $certificate->id,
            'created_by' => $certificate->created_by,
            'approved_by' => $certificate->approved_by,
            'document_type' => 'medical_certificate',
            'title' => 'Medical Certificate',
            'related_service' => 'Medical Consultation',
            'requested_at' => $certificate->created_at,
            'approved_at' => $certificate->approved_at,
        ], $status, $notify);
    }

    public function markReady(MedicalDocument $document, User $actor, Request $request): MedicalDocument
    {
        return $this->transition($document, $actor, 'ready_for_pickup', 'marked_ready', $request, [
            'ready_at' => now(), 'ready_by' => $actor->id,
            'release_instructions' => config('medical.document_release.instructions'),
        ]);
    }

    public function release(MedicalDocument $document, User $actor, array $data, Request $request): MedicalDocument
    {
        return DB::transaction(function () use ($document, $actor, $data, $request): MedicalDocument {
            $locked = MedicalDocument::query()->lockForUpdate()->findOrFail($document->id);
            abort_unless($locked->status === 'ready_for_pickup', 422, 'Only ready documents can be released.');
            $locked->releases()->create([...$data, 'released_by' => $actor->id, 'released_at' => now()]);
            $old = $locked->status;
            $locked->update(['status' => 'released', 'released_at' => now(), 'released_by' => $actor->id]);
            $this->audit($locked, $actor, 'released', $old, 'released', $request, [
                'recipient_type' => $data['recipient_type'], 'recipient_name' => $data['recipient_name'] ?? null,
                'release_method' => $data['release_method'],
            ]);
            $this->notify($locked);

            return $locked->refresh();
        });
    }

    public function reverseRelease(MedicalDocument $document, User $actor, string $reason, Request $request): MedicalDocument
    {
        return DB::transaction(function () use ($document, $actor, $reason, $request): MedicalDocument {
            $locked = MedicalDocument::query()->lockForUpdate()->findOrFail($document->id);
            abort_unless($locked->status === 'released', 422, 'Only released documents can be reversed.');
            $release = $locked->releases()->whereNull('reversed_at')->latest('released_at')->firstOrFail();
            $release->update(['reversed_by' => $actor->id, 'reversed_at' => now(), 'reversal_reason' => $reason]);
            $locked->update(['status' => 'ready_for_pickup', 'released_at' => null, 'released_by' => null]);
            $this->audit($locked, $actor, 'release_reversed', 'released', 'ready_for_pickup', $request, ['reason' => $reason]);
            $this->notify($locked);

            return $locked->refresh();
        });
    }

    private function upsert(Appointment $appointment, string $type, string $title, string $service, string $status): void
    {
        if (in_array($appointment->status, ['cancelled', 'rejected'], true)) {
            $status = 'cancelled';
        }
        $this->saveSource([
            'source_key' => "appointment:{$appointment->id}:{$type}", 'source_type' => 'appointment',
            'source_id' => $appointment->id, 'patient_id' => $appointment->user_id,
            'appointment_id' => $appointment->id, 'document_type' => $type, 'title' => $title,
            'related_service' => $service, 'requested_at' => $appointment->created_at,
        ], $status);
    }

    private function saveSource(array $values, string $status, bool $notify = false): MedicalDocument
    {
        $document = MedicalDocument::firstOrNew(['source_key' => $values['source_key']]);
        $isNew = ! $document->exists;
        $old = $document->status;
        $protected = in_array($old, ['ready_for_pickup', 'released'], true) && ! in_array($status, ['cancelled', 'voided'], true);
        $document->fill($values);
        if ($isNew) {
            $document->document_number = $this->number();
        }
        if (! $protected) {
            $document->status = $status;
        }
        $document->release_instructions ??= config('medical.document_release.instructions');
        $document->save();
        if ($isNew || $old !== $document->status) {
            $document->audits()->create(['action' => $isNew ? 'registered' : 'status_synchronized', 'old_status' => $old, 'new_status' => $document->status]);
            if ($notify && ! $isNew) {
                $this->notify($document);
            }
        }

        return $document;
    }

    private function transition(MedicalDocument $document, User $actor, string $status, string $action, Request $request, array $attributes): MedicalDocument
    {
        return DB::transaction(function () use ($document, $actor, $status, $action, $request, $attributes): MedicalDocument {
            $locked = MedicalDocument::query()->lockForUpdate()->findOrFail($document->id);
            abort_unless($locked->status === 'approved', 422, 'Only approved documents can be marked ready.');
            $old = $locked->status;
            $locked->update([...$attributes, 'status' => $status]);
            $this->audit($locked, $actor, $action, $old, $status, $request);
            $this->notify($locked);

            return $locked->refresh();
        });
    }

    private function audit(MedicalDocument $document, User $actor, string $action, ?string $old, ?string $new, Request $request, array $metadata = []): void
    {
        $document->audits()->create(['actor_id' => $actor->id, 'action' => $action, 'old_status' => $old,
            'new_status' => $new, 'metadata' => $metadata ?: null, 'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 1000)]);
    }

    private function notify(MedicalDocument $document): void
    {
        try {
            $document->patient?->notify(new MedicalDocumentStatusChanged($document));
        } catch (\Throwable $e) {
            Log::warning('Medical document notification failed', ['document_id' => $document->id, 'error' => $e->getMessage()]);
        }
    }

    private function number(): string
    {
        do {
            $number = 'DOC-'.now()->format('Y').'-'.Str::upper(Str::random(10));
        } while (MedicalDocument::where('document_number', $number)->exists());

        return $number;
    }
}
