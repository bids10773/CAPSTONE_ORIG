<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataManagementSetting extends Model
{
    protected $fillable = [
        'retention_years',
        'inactivity_months',
        'scheduled_backups_enabled',
        'backup_interval_months',
        'automatic_deletion_enabled',
    ];

    protected function casts(): array
    {
        return [
            'retention_years' => 'integer',
            'inactivity_months' => 'integer',
            'scheduled_backups_enabled' => 'boolean',
            'backup_interval_months' => 'integer',
            'automatic_deletion_enabled' => 'boolean',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1])->refresh();
    }
}
