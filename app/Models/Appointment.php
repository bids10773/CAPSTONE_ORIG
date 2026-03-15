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
        'appointment_date',
        'type',
        'status',
        'service_type',
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
        ];
    }

    /**
     * Get the patient (user) who owns this appointment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the company associated with this appointment.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
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
            'individual' => 'Individual (Walk-in)',
            'company_referral' => 'Company Referral',
            'company_bulk' => 'Company Bulk Booking',
        ];
    }

    /**
     * Get service type options.
     */
    public static function getServiceTypeOptions(): array
    {
        return [
            'Full PME' => 'Full Physical Medical Examination (PME)',
            'CBC' => 'Complete Blood Count (CBC)',
            'Urinalysis' => 'Urinalysis',
            'Fecalysis' => 'Fecalysis',
            'X-Ray' => 'X-Ray',
            'ECG' => 'Electrocardiogram (ECG)',
            'Audiometry' => 'Audiometry',
            'Drug Test' => 'Drug Test',
            'Hepatitis' => 'Hepatitis B Screening',
            'FBS' => 'Fasting Blood Sugar',
            'Pregnancy Test' => 'Pregnancy Test',
            'Custom' => 'Custom/Package',
        ];
    }
}
