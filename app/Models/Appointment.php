<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Appointment extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'company_id',
        'doctor_id',
        'start_time',
        'end_time',
        'appointment_date',
        'type',
        'status',
        'service_types',
        'referral_code',
        'notes',
        'batch_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'appointment_date' => 'datetime',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'service_types' => 'array',
        ];
    }

    /**
     * Get the patient (user) who owns this appointment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }


public function patientProfile(): HasOne
{
    return $this->hasOne(\App\Models\PatientProfile::class, 'user_id', 'user_id');
}

    /**
     * Get the company associated with this appointment.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the doctor assigned to this appointment.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the physical exam for this appointment.
     */
    public function physicalExam(): HasOne
    {
        return $this->hasOne(PhysicalExam::class);
    }

    /**
     * Get the lab result for this appointment.
     */
    public function labResult(): HasOne
    {
        return $this->hasOne(LabResult::class);
    }

    /**
     * Get the x-ray report for this appointment.
     */
    public function xrayReport(): HasOne
    {
        return $this->hasOne(XrayReport::class);
    }

    /**
     * Get the medical history for this appointment.
     */
    public function medicalHistory(): HasOne
    {
        return $this->hasOne(MedicalHistory::class, 'appointment_id');
    }

    /**
     * Get status badge color.
     */
    public function getStatusBadgeAttribute(): string
    {
        return match($this->status) {
            'pending' => 'yellow',
            'accepted' => 'indigo',
            'arrived' => 'blue',
            'completed' => 'green',
            'cancelled' => 'red',
            default => 'gray',
        };
    }

    /**
     * Get appointment type options.
     */
    public static function getTypeOptions(): array
    {
        return [
            'individual' => 'Individual',
            'company_referral' => 'Company Referral',
            'company_bulk' => 'Company Bulk Booking',
        ];
    }

    /**
     * Get service type options.
     */
      // ✅ ADD THIS BACK (IMPORTANT)
    public static function getServiceTypeOptions(): array
    {
        return [
            'PE' => 'Physical Medical Examination (PE)',
            'CBC' => 'Complete Blood Count (CBC)',
            'Urinalysis' => 'Urinalysis',
            'Fecalysis' => 'Fecalysis',
            'X-Ray' => 'Chest X-Ray',
            'ECG' => 'Electrocardiogram (ECG)',
            'Audiometry' => 'Audiometry',
            'Drug Test' => 'Drug Test',
            'Hepatitis' => 'Hepatitis B Screening',
            'Blood Typing' => 'Blood Typing',
            'Pregnancy Test' => 'Pregnancy Test',
            'Neuro Psychiatric Test' => 'Neuro Psychiatric Test',
            
        ];
    }

    // ✅ helper for display
    public function getServiceTypesListAttribute(): string
    {
        return implode(', ', $this->service_types ?? []);
    }
}
