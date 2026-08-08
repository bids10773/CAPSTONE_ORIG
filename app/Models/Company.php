<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'company_name', 'email', 'contact_number', 'address', 'industry_type',
        'logo_path', 'status', 'is_partnered',
    ];

    protected function casts(): array
    {
        return ['is_partnered' => 'boolean'];
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(CompanyReferral::class);
    }

    public function account(): HasMany
    {
        return $this->users()->where('role', 'company');
    }

    public static function getIndustryTypes(): array
    {
        return array_combine($types = [
            'Manufacturing', 'Healthcare', 'IT/BPO', 'Retail', 'Construction',
            'Food & Beverage', 'Logistics', 'Education', 'Finance', 'Others',
        ], $types);
    }
}
