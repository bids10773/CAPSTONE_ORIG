<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabResult extends Model
{
    protected $fillable = [
        'appointment_id', 'medical_examination_id', 'encoded_by', 'verified_by', 'cbc_results',
        'urinalysis_results', 'fecalysis_results', 'drug_test_results',
        'serology_results', 'blood_chemistry_results', 'blood_type',
        'pregnancy_test', 'remarks', 'status', 'is_completed', 'finalized_at',
    ];

    protected function casts(): array
    {
        return [
            'cbc_results' => 'array', 'urinalysis_results' => 'array',
            'fecalysis_results' => 'array', 'drug_test_results' => 'array',
            'serology_results' => 'array', 'blood_chemistry_results' => 'array',
            'blood_type' => 'array', 'pregnancy_test' => 'array',
            'is_completed' => 'boolean', 'finalized_at' => 'datetime',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function medicalExamination(): BelongsTo
    {
        return $this->belongsTo(MedicalExamination::class);
    }

    public function encodedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'encoded_by');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function isFinalized(): bool
    {
        return $this->status === 'finalized' || $this->finalized_at !== null;
    }
}
