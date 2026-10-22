<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VitalSignRecheckRequest extends Model
{
    protected $fillable = ['appointment_id', 'requested_by', 'resolved_by', 'resolved_vital_sign_id',
        'status', 'reason', 'requested_at', 'resolved_at'];

    protected function casts(): array
    {
        return ['requested_at' => 'datetime', 'resolved_at' => 'datetime'];
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function resolvedVitalSign(): BelongsTo
    {
        return $this->belongsTo(VitalSign::class, 'resolved_vital_sign_id');
    }
}
