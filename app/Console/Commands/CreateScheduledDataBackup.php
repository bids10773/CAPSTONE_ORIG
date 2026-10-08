<?php

namespace App\Console\Commands;

use App\Services\DataBackupService;
use Illuminate\Console\Command;

class CreateScheduledDataBackup extends Command
{
    protected $signature = 'data:backup-scheduled';

    protected $description = 'Create the six-month data backup when it is due';

    public function handle(DataBackupService $backups): int
    {
        $backup = $backups->createScheduledIfDue();
        $this->info($backup ? "Created scheduled backup #{$backup->id}." : 'No scheduled backup is due.');

        return self::SUCCESS;
    }
}
