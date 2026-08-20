<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BulkMedicalReport extends Model
{
    protected $fillable = [
        'bulk_appointment_id', 'company_id', 'status', 'columns', 'row_count', 'file_path',
        'generated_by', 'generated_at', 'released_by', 'released_at',
    ];

    protected function casts(): array
    {
        return ['columns' => 'array', 'generated_at' => 'datetime', 'released_at' => 'datetime'];
    }

    public function bulkAppointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'bulk_appointment_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function releasedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }
}
