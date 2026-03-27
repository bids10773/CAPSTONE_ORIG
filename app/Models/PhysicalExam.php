<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PhysicalExam extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
    'appointment_id',
    'doctor_id',

    // Vital Signs
    'height',
    'weight',
    'blood_pressure',
    'pulse_rate',
    'temperature',
    'remarks',

    // ✅ PHYSICAL FINDINGS (ADD THESE)
    'head_scalp',
    'eyes',
    'ears',
    'nose_sinuses',
    'mouth_throat',
    'neck_thyroid',
    'chest_breast',
    'lungs',
    'heart',
    'abdomen',
    'back',
    'anus',
    'genitals',
    'extremities',
    'skin',
    'dental',

    // Classification
    'classification',
    'doctor_remarks',
];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'height' => 'decimal:2',
            'weight' => 'decimal:2',
            'temperature' => 'decimal:2',
        ];
    }

    /**
     * Get the appointment that owns the physical exam.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the doctor who performed the exam.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the medical history for this physical exam.
     */
    public function medicalHistory(): HasOne
    {
        return $this->hasOne(MedicalHistory::class, 'appointment_id');
    }

    /**
     * Get classification options.
     */
    public static function getClassificationOptions(): array
    {
        return [
            'Class A' => 'Fit to work',
            'Class B' => 'Minor defects',
            'Class C' => 'Management discretion',
            'Pending' => 'Pending',
            'Unfit' => 'Unfit to work',
        ];
    }
}
