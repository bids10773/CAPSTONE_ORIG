<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalCertificateAudit extends Model
{
    protected $fillable = [
        'medical_certificate_id',
        'actor_id',
        'action',
        'old_status',
        'new_status',
        'changes',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
        ];
    }

    public function medicalCertificate(): BelongsTo
    {
        return $this->belongsTo(MedicalCertificate::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
