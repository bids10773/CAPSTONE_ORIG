<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasRoles, HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'contact',
        'password',
        'role',
        'license_no',
        'specialization',
        'signature_path',
        'company_id',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'name',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
            'availability' => 'array',
        ];
    }

    /**
     * Get the user's full name attribute.
     */
    public function getNameAttribute(): string
    {
        $name = trim(($this->first_name ?? '') . ' ' . ($this->middle_name ?? ''));
        $name = trim($name . ' ' . ($this->last_name ?? ''));
        return $name;
    }

    /**
     * Get the company that owns the user (if user is associated with a company).
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get appointments assigned to this doctor.
     */
    public function doctorAppointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    /**
     * Get the appointments for this user (if patient).
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Get the patient profile for this user.
     */
    public function patientProfile(): HasOne
    {
        return $this->hasOne(PatientProfile::class);
    }

    /**
     * Get physical exams performed by this doctor.
     */
    public function physicalExams(): HasMany
    {
        return $this->hasMany(PhysicalExam::class, 'doctor_id');
    }

    /**
     * Get lab results encoded by this medtech.
     */
    public function encodedLabResults(): HasMany
    {
        return $this->hasMany(LabResult::class, 'encoded_by');
    }

    /**
     * Get x-ray reports encoded by this radtech.
     */
    public function xrayReports(): HasMany
    {
        return $this->hasMany(XrayReport::class, 'radiologist_id');
    }

    /**
     * Check if user is active.
     */
    public function isActive(): bool
    {
        return $this->is_active ?? false;
    }

    /**
     * Get role label for display.
     */
    public function getRoleLabelAttribute(): string
    {
        return match($this->role) {
            'admin' => 'Administrator',
            'doctor' => 'Doctor',
            'medtech' => 'Medical Technologist',
            'radtech' => 'Radiologic Technologist',
            'company' => 'Company',
            'patient' => 'Patient',
            default => ucfirst($this->role ?? 'Unknown'),
        };
    }

    /**
     * Get available roles for staff creation.
     */
    public static function getStaffRoles(): array
    {
        return [
            'doctor' => 'Doctor',
            'medtech' => 'Medical Technologist',
            'radtech' => 'Radiologic Technologist',
        ];
    }

}
