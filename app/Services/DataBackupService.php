<?php

namespace App\Services;

use App\Models\DataBackup;
use App\Models\DataManagementSetting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;
use ZipArchive;

class DataBackupService
{
    private const EXCLUDED_TABLES = [
        'cache',
        'cache_locks',
        'failed_jobs',
        'job_batches',
        'jobs',
        'password_reset_tokens',
        'sessions',
    ];

    public function create(string $type = 'manual', ?User $actor = null): DataBackup
    {
        $backupDisk = (string) config('data_management.backup_disk', 'local');
        $stamp = now()->format('Ymd-His');
        $filename = "data-backups/lmic-{$type}-{$stamp}-".Str::lower(Str::random(8)).'.zip';
        $backup = DataBackup::query()->create([
            'filename' => $filename,
            'disk' => $backupDisk,
            'type' => $type,
            'status' => 'running',
            'included_data' => ['patient medical records', 'patient accounts', 'staff accounts'],
            'created_by' => $actor?->id,
        ]);

        $temporaryDirectory = storage_path('framework/cache/data-backup-'.Str::uuid());
        $temporaryArchive = $temporaryDirectory.'/backup.zip';

        try {
            if (! is_dir($temporaryDirectory) && ! mkdir($temporaryDirectory, 0700, true) && ! is_dir($temporaryDirectory)) {
                throw new RuntimeException('Unable to create the temporary backup directory.');
            }

            $zip = new ZipArchive;
            if ($zip->open($temporaryArchive, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new RuntimeException('Unable to create the backup archive.');
            }
            $zip->setPassword($this->archivePassword());

            $tableCounts = $this->addDatabase($zip, $temporaryDirectory);
            $fileCounts = [
                'private' => $this->addDiskFiles($zip, 'local', 'files/private', ['data-backups/']),
                'public' => $this->addDiskFiles($zip, 'public', 'files/public'),
            ];

            $manifestName = 'manifest.json';
            $zip->addFromString($manifestName, json_encode([
                'created_at' => now()->toIso8601String(),
                'application' => config('app.name'),
                'backup_type' => $type,
                'contents' => ['patient medical records', 'patient accounts', 'staff accounts'],
                'tables' => $tableCounts,
                'files' => $fileCounts,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
            $this->encryptEntry($zip, $manifestName);
            $zip->close();

            $stream = fopen($temporaryArchive, 'rb');
            if ($stream === false || ! Storage::disk($backupDisk)->put($filename, $stream)) {
                throw new RuntimeException('Unable to save the backup to private storage.');
            }
            if (is_resource($stream)) {
                fclose($stream);
            }

            $backup->update([
                'status' => 'completed',
                'size_bytes' => filesize($temporaryArchive),
                'checksum_sha256' => hash_file('sha256', $temporaryArchive),
                'completed_at' => now(),
            ]);
        } catch (Throwable $exception) {
            $backup->update([
                'status' => 'failed',
                'error_message' => Str::limit($exception->getMessage(), 2000),
            ]);
            throw $exception;
        } finally {
            if (is_dir($temporaryDirectory)) {
                File::deleteDirectory($temporaryDirectory);
            }
        }

        return $backup->refresh();
    }

    public function createScheduledIfDue(): ?DataBackup
    {
        $settings = DataManagementSetting::current();
        if (! $settings->scheduled_backups_enabled) {
            return null;
        }

        $latest = DataBackup::query()
            ->where('type', 'scheduled')
            ->where('status', 'completed')
            ->latest('completed_at')
            ->first();

        if ($latest?->completed_at?->gt(now()->subMonths($settings->backup_interval_months))) {
            return null;
        }

        return $this->create('scheduled');
    }

    /** @return array<string, int> */
    private function addDatabase(ZipArchive $zip, string $temporaryDirectory): array
    {
        $counts = [];
        $tables = array_values(array_filter(
            Schema::getTableListing(),
            fn (string $table): bool => ! in_array(Str::afterLast($table, '.'), self::EXCLUDED_TABLES, true),
        ));
        sort($tables);

        foreach ($tables as $table) {
            $safeName = preg_replace('/[^A-Za-z0-9_.-]/', '_', Str::afterLast($table, '.'));
            $path = "{$temporaryDirectory}/{$safeName}.jsonl";
            $handle = fopen($path, 'wb');
            if ($handle === false) {
                throw new RuntimeException("Unable to prepare the {$table} backup.");
            }

            $count = 0;
            foreach (DB::table($table)->cursor() as $row) {
                fwrite($handle, json_encode((array) $row, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR).PHP_EOL);
                $count++;
            }
            fclose($handle);

            $entryName = "database/{$safeName}.jsonl";
            $zip->addFile($path, $entryName);
            $this->encryptEntry($zip, $entryName);
            $counts[Str::afterLast($table, '.')] = $count;
        }

        return $counts;
    }

    /** @param list<string> $excludedPrefixes */
    private function addDiskFiles(ZipArchive $zip, string $disk, string $archiveRoot, array $excludedPrefixes = []): int
    {
        $count = 0;
        foreach (Storage::disk($disk)->allFiles() as $path) {
            if (collect($excludedPrefixes)->contains(fn (string $prefix): bool => str_starts_with($path, $prefix))) {
                continue;
            }

            $contents = Storage::disk($disk)->get($path);
            $entryName = $archiveRoot.'/'.ltrim($path, '/');
            $zip->addFromString($entryName, $contents);
            $this->encryptEntry($zip, $entryName);
            $count++;
        }

        return $count;
    }

    private function archivePassword(): string
    {
        $key = (string) config('data_management.encryption_key');
        if ($key === '') {
            throw new RuntimeException('DATA_BACKUP_ENCRYPTION_KEY or APP_KEY must be configured.');
        }

        return hash('sha256', $key.'|lmic-data-backup-v1');
    }

    private function encryptEntry(ZipArchive $zip, string $entryName): void
    {
        if (! $zip->setEncryptionName($entryName, ZipArchive::EM_AES_256)) {
            throw new RuntimeException("Unable to encrypt backup entry {$entryName}.");
        }
    }
}
