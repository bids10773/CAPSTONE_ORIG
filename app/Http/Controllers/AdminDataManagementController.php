<?php

namespace App\Http\Controllers;

use App\Models\DataBackup;
use App\Models\DataManagementSetting;
use App\Services\DataBackupService;
use App\Services\DataRetentionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class AdminDataManagementController extends Controller
{
    public function index(DataRetentionService $retention): Response
    {
        $settings = DataManagementSetting::current();
        $lastScheduled = DataBackup::query()
            ->where('type', 'scheduled')
            ->where('status', 'completed')
            ->latest('completed_at')
            ->first();

        return Inertia::render('admin/data-management/index', [
            'policy' => $settings->only([
                'retention_years',
                'inactivity_months',
                'scheduled_backups_enabled',
                'backup_interval_months',
                'automatic_deletion_enabled',
            ]),
            'retentionSummary' => $retention->summary($settings),
            'nextScheduledBackupAt' => $settings->scheduled_backups_enabled
                ? ($lastScheduled?->completed_at ?? now())->addMonths($settings->backup_interval_months)->toIso8601String()
                : null,
            'backups' => DataBackup::query()
                ->with('creator:id,first_name,middle_name,last_name')
                ->latest()
                ->limit(20)
                ->get()
                ->map(fn (DataBackup $backup): array => [
                    'id' => $backup->id,
                    'type' => $backup->type,
                    'status' => $backup->status,
                    'size_bytes' => $backup->size_bytes,
                    'checksum_sha256' => $backup->checksum_sha256,
                    'created_by' => $backup->creator?->name ?? 'System',
                    'created_at' => $backup->created_at->toIso8601String(),
                    'completed_at' => $backup->completed_at?->toIso8601String(),
                    'download_url' => $backup->status === 'completed'
                        ? route('admin.data-management.backups.download', $backup)
                        : null,
                ]),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'retention_years' => ['required', 'integer', 'min:1', 'max:25'],
            'inactivity_months' => ['required', 'integer', 'min:6', 'max:300'],
            'scheduled_backups_enabled' => ['required', 'boolean'],
            'automatic_deletion_enabled' => ['required', 'boolean'],
        ]);

        DataManagementSetting::current()->update($validated + ['backup_interval_months' => 6]);

        return back()->with('success', 'Data retention and backup policy updated.');
    }

    public function backup(Request $request, DataBackupService $backups): RedirectResponse
    {
        try {
            $backups->create('manual', $request->user());

            return back()->with('success', 'The manual backup was created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'The backup could not be created. Check the application logs for details.');
        }
    }

    public function enforce(DataRetentionService $retention): RedirectResponse
    {
        try {
            $result = $retention->enforce(false);

            return back()->with('success', sprintf(
                'Retention completed: %d medical records removed, %d accounts removed, %d referenced accounts anonymized, and %d expired backups removed.',
                $result['medical_records_deleted'],
                $result['accounts_deleted'],
                $result['accounts_anonymized'],
                $result['backups_deleted'],
            ));
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Retention could not be completed. No deletion proceeds without a successful backup.');
        }
    }

    public function download(DataBackup $backup): StreamedResponse
    {
        abort_unless($backup->status === 'completed' && Storage::disk($backup->disk)->exists($backup->filename), 404);

        return Storage::disk($backup->disk)->download($backup->filename, basename($backup->filename));
    }
}
