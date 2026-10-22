<?php

return [
    'backup_disk' => env('DATA_BACKUP_DISK', 'local'),
    'encryption_key' => env('DATA_BACKUP_ENCRYPTION_KEY') ?: env('APP_KEY'),
];
