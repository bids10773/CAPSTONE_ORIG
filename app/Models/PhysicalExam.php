<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'respiratory_rate',
        'temperature',
        
        // Medical History
        'present_illness',
        'past_medical_history',
        'operations_accidents',
        'family_history',
        'allergies',
        'ob_menstrual_history',
        
        // System Review - General
        'is_general_normal',
        'general_remarks',
        
        // System Review - Head/Scalp
        'is_head_normal',
        'head_remarks',
        
        // System Review - Eyes
        'is_eyes_normal',
        'eyes_remarks',
        
        // System Review - Ears
        'is_ears_normal',
        'ears_remarks',
        
        // System Review - Nose/Sinuses
        'is_nose_normal',
        'nose_remarks',
        
        // System Review - Mouth/Throat
        'is_mouth_normal',
        'mouth_remarks',
        
        // System Review - Neck/Thyroid
        'is_neck_normal',
        'neck_remarks',
        
        // System Review - Chest/Breasts
        'is_chest_normal',
        'chest_remarks',
        
        // System Review - Lungs
        'is_lungs_normal',
        'lungs_remarks',
        
        // System Review - Heart
        'is_heart_normal',
        'heart_remarks',
        
        // System Review - Abdomen
        'is_abdomen_normal',
        'abdomen_remarks',
        
        // System Review - Extremities
        'is_extremities_normal',
        'extremities_remarks',
        
        // Classification
        'classification',
        
        // Doctor Remarks
        'doctor_remarks',
        
        // Status
        'is_completed',
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
