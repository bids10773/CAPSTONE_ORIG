<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiagnosticResult extends Model
{
    protected $fillable = [
        'medical_examination_id', 'appointment_id', 'patient_id', 'company_id', 'batch_id',
        'service_key', 'status', 'result_data', 'findings', 'remarks',
        'official_reference_number', 'official_result_date', 'supporting_document_path',
        'performed_by', 'performed_at', 'encoded_by', 'encoded_at', 'verified_by', 'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'result_data' => 'array',
            'official_result_date' => 'date',
            'performed_at' => 'datetime',
            'encoded_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function medicalExamination(): BelongsTo
    {
        return $this->belongsTo(MedicalExamination::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function isVerified(): bool
    {
        return $this->status === 'verified' && $this->verified_at !== null;
    }
}
