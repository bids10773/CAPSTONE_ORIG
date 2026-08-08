<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    protected static function booted(): void
    {
        static::created(function (Appointment $appointment): void {
            if ($appointment->isPePackage() && $appointment->user?->role === 'patient') {
                app(\App\Services\MedicalExaminationService::class)->forAppointment($appointment);
            }
        });

        static::updated(function (Appointment $appointment): void {
            if ($appointment->wasChanged('status') && $appointment->bulk_appointment_id !== null) {
                app(\App\Services\BulkAppointmentEnrollmentService::class)
                    ->recalculateParentStatus($appointment);
            }
            if ($appointment->wasChanged('status') && $appointment->company_referral_id !== null) {
                $referral = $appointment->companyReferral;
                if ($appointment->status === 'completed') {
                    $referral?->update(['status' => 'completed', 'completed_at' => now()]);
                } elseif ($appointment->status === 'cancelled') {
                    $referral?->update(['status' => 'cancelled', 'cancelled_at' => now()]);
                }
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'company_id',
        'company_name',
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
        'bulk_appointment_id',
        'company_referral_id',
        'arrived_at',
        'checked_in_by',
        'auto_cancelled_at',
        'cancellation_reason',
        'released_from_appointment_id',
        'released_slot_assigned_at',
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
            'arrived_at' => 'datetime',
            'auto_cancelled_at' => 'datetime',
            'released_slot_assigned_at' => 'datetime',
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

    public function medicalExamination(): HasOne
    {
        return $this->hasOne(MedicalExamination::class);
    }

    public function checkedInBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }

    public function bulkAppointment(): BelongsTo
    {
        return $this->belongsTo(self::class, 'bulk_appointment_id');
    }

    public function companyReferral(): BelongsTo
    {
        return $this->belongsTo(CompanyReferral::class);
    }

    public function bulkEmployees(): HasMany
    {
        return $this->hasMany(self::class, 'bulk_appointment_id');
    }

    public function isBulkParent(): bool
    {
        return $this->type === 'company_bulk'
            && $this->bulk_appointment_id === null
            && $this->user?->role === 'company';
    }

    public function releasedFromAppointment(): BelongsTo
    {
        return $this->belongsTo(self::class, 'released_from_appointment_id');
    }

    public function replacementWalkIn(): HasOne
    {
        return $this->hasOne(self::class, 'released_from_appointment_id');
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
        return match ($this->status) {
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
            'walk_in' => 'Walk-in',
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
            'FBS' => 'Fasting Blood Sugar (FBS)',
            'Blood Chemistry' => 'Blood Chemistry Panel',
            'Neuro Psychiatric Test' => 'Neuro Psychiatric Test',

        ];
    }

    // ✅ helper for display
    public function getServiceTypesListAttribute(): string
    {
        return implode(', ', $this->service_types ?? []);
    }

    public function isPePackage(): bool
    {
        return in_array('PE', $this->service_types ?? [], true);
    }

    public function requiresXray(): bool
    {
        return in_array('X-Ray', $this->service_types ?? [], true)
            || ($this->isPePackage() && config('medical.pe_package.requires_xray', true));
    }
}
