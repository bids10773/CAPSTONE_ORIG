<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicalCertificate extends Model
{
    public const STATUSES = [
        'draft',
        'pending_approval',
        'changes_requested',
        'approved',
        'issued',
        'void',
    ];

    protected $fillable = [
        'certificate_number',
        'sequence_year',
        'sequence_number',
        'patient_id',
        'appointment_id',
        'attending_physician_id',
        'created_by',
        'updated_by',
        'approved_by',
        'issued_by',
        'voided_by',
        'salutation',
        'patient_name',
        'patient_reference_code',
        'patient_age',
        'patient_sex',
        'patient_civil_status',
        'consultation_date',
        'reason_for_consultation',
        'clinical_impression',
        'recommendation',
        'rest_start_date',
        'rest_end_date',
        'date_issued',
        'physician_name',
        'physician_license_no',
        'status',
        'approval_notes',
        'change_request_reason',
        'void_reason',
        'submitted_at',
        'approved_at',
        'issued_at',
        'voided_at',
    ];

    protected function casts(): array
    {
        return [
            'sequence_year' => 'integer',
            'sequence_number' => 'integer',
            'patient_age' => 'integer',
            'consultation_date' => 'date',
            'rest_start_date' => 'date',
            'rest_end_date' => 'date',
            'date_issued' => 'date',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'issued_at' => 'datetime',
            'voided_at' => 'datetime',
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

    public function attendingPhysician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'attending_physician_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function voider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function audits(): HasMany
    {
        return $this->hasMany(MedicalCertificateAudit::class);
    }

    public function medicalDocuments(): HasMany
    {
        return $this->hasMany(MedicalDocument::class);
    }
}
