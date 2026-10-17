<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicalDocument extends Model
{
    public const STATUSES = [
        'pending',
        'for_review',
        'approved',
        'ready_for_pickup',
        'released',
        'cancelled',
        'voided',
    ];

    public const TYPES = [
        'medical_certificate',
        'physical_examination',
        'laboratory_report',
        'xray_report',
    ];

    protected $fillable = [
        'document_number', 'source_key', 'source_type', 'source_id', 'patient_id',
        'appointment_id', 'medical_certificate_id', 'created_by', 'approved_by',
        'ready_by', 'released_by', 'cancelled_by', 'document_type', 'title',
        'related_service', 'status', 'release_instructions', 'requested_at',
        'approved_at', 'ready_at', 'released_at', 'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'approved_at' => 'datetime',
            'ready_at' => 'datetime',
            'released_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function medicalCertificate(): BelongsTo
    {
        return $this->belongsTo(MedicalCertificate::class);
    }

    public function releases(): HasMany
    {
        return $this->hasMany(MedicalDocumentRelease::class);
    }

    public function audits(): HasMany
    {
        return $this->hasMany(MedicalDocumentAudit::class);
    }

    public function scopeReleaseVisible(Builder $query): Builder
    {
        return $query->where(function (Builder $visible): void {
            $visible->whereNotIn('document_type', ['laboratory_report', 'xray_report'])
                ->orWhereDoesntHave('appointment', fn (Builder $appointment) => $appointment
                    ->whereJsonContains('service_types', 'PE'));
        });
    }

    public function scopeVisibleTo(Builder $query, User $actor): Builder
    {
        $query->releaseVisible();

        if (in_array($actor->role, ['admin', 'receptionist'], true)) {
            return $query;
        }

        if ($actor->role === 'doctor') {
            return $query->where(function (Builder $visible) use ($actor): void {
                $visible->whereHas('medicalCertificate', fn (Builder $certificate) => $certificate
                    ->where('attending_physician_id', $actor->id))
                    ->orWhereHas('appointment', fn (Builder $appointment) => $appointment
                        ->where('doctor_id', $actor->id)
                        ->orWhereHas('medicalExamination', fn (Builder $exam) => $exam
                            ->where('examining_doctor_id', $actor->id)
                            ->orWhere('finalized_by', $actor->id))
                        ->orWhereHas('serviceQueues', fn (Builder $queue) => $queue
                            ->where('assigned_staff_id', $actor->id)
                            ->whereIn('service_role', ['doctor', 'drug_verification', 'final_evaluation'])));
            });
        }

        if ($actor->role === 'medtech') {
            return $query->where('document_type', 'laboratory_report')
                ->whereHas('appointment', fn (Builder $appointment) => $appointment
                    ->whereNull('bulk_appointment_id')
                    ->orWhereHas('labResult', fn (Builder $lab) => $lab->where('encoded_by', $actor->id))
                    ->orWhereHas('serviceQueues', fn (Builder $queue) => $queue
                        ->where('assigned_staff_id', $actor->id)->where('service_role', 'medtech')));
        }

        if ($actor->role === 'radtech') {
            return $query->where('document_type', 'xray_report')
                ->whereHas('appointment', fn (Builder $appointment) => $appointment
                    ->whereNull('bulk_appointment_id')
                    ->orWhereHas('xrayReport', fn (Builder $xray) => $xray->where('radiologist_id', $actor->id))
                    ->orWhereHas('serviceQueues', fn (Builder $queue) => $queue
                        ->where('assigned_staff_id', $actor->id)->where('service_role', 'radtech')));
        }

        return $query->whereRaw('1 = 0');
    }
}
