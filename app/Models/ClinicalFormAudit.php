<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicalFormAudit extends Model
{
    protected $fillable = ['appointment_id', 'actor_id', 'form_type', 'action', 'changes', 'ip_address', 'user_agent'];

    protected function casts(): array
    {
        return ['changes' => 'array'];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
