<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VitalSign extends Model
{
    protected $fillable = [
        'patient_id', 'appointment_id', 'medical_examination_id', 'recorded_by', 'supersedes_id', 'submission_key',
        'measurement_type', 'systolic_pressure', 'diastolic_pressure', 'heart_rate', 'respiratory_rate',
        'temperature', 'oxygen_saturation', 'height', 'weight', 'bmi', 'notes', 'measured_at',
    ];

    protected function casts(): array
    {
        return ['temperature' => 'decimal:1', 'oxygen_saturation' => 'decimal:2', 'height' => 'decimal:1',
            'weight' => 'decimal:1', 'bmi' => 'decimal:1', 'measured_at' => 'datetime'];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function supersedes(): BelongsTo
    {
        return $this->belongsTo(self::class, 'supersedes_id');
    }
}
