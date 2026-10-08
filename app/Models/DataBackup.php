<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DataBackup extends Model
{
    protected $fillable = [
        'filename',
        'disk',
        'type',
        'status',
        'included_data',
        'size_bytes',
        'checksum_sha256',
        'created_by',
        'completed_at',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'included_data' => 'array',
            'size_bytes' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
