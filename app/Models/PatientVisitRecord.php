<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientVisitRecord extends Model
{
    protected $fillable = [
        'record_month',
        'walk_in',
        'online_appointments',
        'company_referrals',
        'ape',
        'follow_up',
        'emergency_walk_ins',
        'is_demo',
    ];

    protected function casts(): array
    {
        return [
            'record_month' => 'date',
            'walk_in' => 'integer',
            'online_appointments' => 'integer',
            'company_referrals' => 'integer',
            'ape' => 'integer',
            'follow_up' => 'integer',
            'emergency_walk_ins' => 'integer',
            'is_demo' => 'boolean',
        ];
    }
}
