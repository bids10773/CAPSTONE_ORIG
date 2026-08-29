<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CompanyReferral extends Model
{
    protected $fillable = [
        'company_id', 'patient_id', 'created_by', 'referral_number',
        'invitation_token_hash', 'employee_email', 'employee_contact', 'first_name',
        'middle_name', 'last_name', 'birthdate', 'sex', 'required_services', 'examination_purpose',
        'valid_until', 'status', 'instructions', 'sent_at', 'viewed_at',
        'scheduled_at', 'completed_at', 'cancelled_at', 'cancelled_by',
        'cancellation_reason',
    ];

    protected $hidden = ['invitation_token_hash'];

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'valid_until' => 'date',
            'required_services' => 'array',
            'sent_at' => 'datetime',
            'viewed_at' => 'datetime',
            'scheduled_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function appointment(): HasOne
    {
        return $this->hasOne(Appointment::class);
    }

    public function isExpired(): bool
    {
        return $this->valid_until->isBefore(today());
    }

    public function isSchedulable(): bool
    {
        return ! $this->isExpired()
            && ! in_array($this->status, ['scheduled', 'completed', 'cancelled', 'expired'], true)
            && $this->appointment()->doesntExist();
    }
}
