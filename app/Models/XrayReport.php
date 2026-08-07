<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class XrayReport extends Model
{
    protected $fillable = [
        'appointment_id',
        'medical_examination_id',
        'radiologist_id',
        'findings',
        'impression',
        'is_completed',
        'status',
        'performed_at',
        'result_available_at',
        'verified_by',
        'verified_at',
        'recommendation',
        'remarks',
        'finalized_by',
        'finalized_at',
    ];

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'finalized_at' => 'datetime',
            'performed_at' => 'datetime',
            'result_available_at' => 'datetime',
            'verified_at' => 'datetime',
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

    public function radiologist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'radiologist_id');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function isVerified(): bool
    {
        return $this->status === 'completed'
            && $this->is_completed
            && $this->verified_at !== null;
    }
}
