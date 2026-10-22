<?php

namespace App\Console\Commands;

use App\Services\DataRetentionService;
use Illuminate\Console\Command;

class EnforceDataRetention extends Command
{
    protected $signature = 'data:enforce-retention';

    protected $description = 'Back up and purge records that exceed the configured retention policy';

    public function handle(DataRetentionService $retention): int
    {
        $result = $retention->enforce();
        $this->info(sprintf(
            'Retention completed: %d records deleted, %d accounts deleted, %d accounts anonymized, %d backups deleted.',
            $result['medical_records_deleted'],
            $result['accounts_deleted'],
            $result['accounts_anonymized'],
            $result['backups_deleted'],
        ));

        return self::SUCCESS;
    }
}
