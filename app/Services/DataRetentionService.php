<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\DataBackup;
use App\Models\DataManagementSetting;
use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DataRetentionService
{
    private const STAFF_ROLES = ['doctor', 'medtech', 'radtech', 'receptionist'];

    public function __construct(private readonly DataBackupService $backups) {}

    /** @return array{medical_records: int, inactive_accounts: int, expired_backups: int} */
    public function summary(?DataManagementSetting $settings = null): array
    {
        $settings ??= DataManagementSetting::current();

        return [
            'medical_records' => Appointment::query()
                ->where('appointment_date', '<', now()->subYears($settings->retention_years))
                ->count(),
            'inactive_accounts' => $this->inactiveAccounts($settings)->count(),
            'expired_backups' => DataBackup::query()
                ->where('status', 'completed')
                ->where('completed_at', '<', now()->subYears($settings->retention_years))
                ->count(),
        ];
    }

    /** @return array{medical_records_deleted: int, accounts_deleted: int, accounts_anonymized: int, backups_deleted: int} */
    public function enforce(bool $requireEnabled = true): array
    {
        $settings = DataManagementSetting::current();
        if ($requireEnabled && ! $settings->automatic_deletion_enabled) {
            return ['medical_records_deleted' => 0, 'accounts_deleted' => 0, 'accounts_anonymized' => 0, 'backups_deleted' => 0];
        }

        $summary = $this->summary($settings);
        if (array_sum($summary) === 0) {
            return ['medical_records_deleted' => 0, 'accounts_deleted' => 0, 'accounts_anonymized' => 0, 'backups_deleted' => 0];
        }

        $this->backups->create('retention');

        $result = [
            'medical_records_deleted' => $this->purgeOldAppointments($settings),
            'accounts_deleted' => 0,
            'accounts_anonymized' => 0,
            'backups_deleted' => 0,
        ];

        $this->inactiveAccounts($settings)->orderBy('id')->each(function (User $user) use (&$result): void {
            $paths = array_values(array_filter([
                $user->license_document_path,
                $user->license_document_back_path,
            ]));
            $signature = $user->signature_path;

            try {
                DB::transaction(function () use ($user): void {
                    if ($user->role === 'patient') {
                        $this->purgeAppointments($user->appointments()->orderByDesc('id')->pluck('id')->all());
                        $user->patientProfile()->delete();
                    }
                    DB::table('sessions')->where('user_id', $user->id)->delete();
                    $user->delete();
                });
                $result['accounts_deleted']++;
            } catch (QueryException) {
                $this->anonymizeReferencedAccount($user);
                $result['accounts_anonymized']++;
            }

            if ($paths !== []) {
                Storage::disk('local')->delete($paths);
            }
            if ($signature) {
                Storage::disk('public')->delete($signature);
            }
        });

        $result['backups_deleted'] = $this->purgeExpiredBackups($settings);

        SecurityAudit::query()->create([
            'action' => 'automatic_data_retention_enforced',
            'status' => 'success',
            'metadata' => $result,
        ]);

        return $result;
    }

    private function purgeExpiredBackups(DataManagementSetting $settings): int
    {
        $deleted = 0;
        DataBackup::query()
            ->where('status', 'completed')
            ->where('completed_at', '<', now()->subYears($settings->retention_years))
            ->each(function (DataBackup $backup) use (&$deleted): void {
                Storage::disk($backup->disk)->delete($backup->filename);
                $backup->delete();
                $deleted++;
            });

        return $deleted;
    }

    private function inactiveAccounts(DataManagementSetting $settings)
    {
        $cutoff = now()->subMonths($settings->inactivity_months);

        return User::query()
            ->whereIn('role', array_merge(['patient'], self::STAFF_ROLES))
            ->whereNull('retention_anonymized_at')
            ->where(function ($query) use ($cutoff): void {
                $query->where('last_active_at', '<=', $cutoff)
                    ->orWhere(function ($query) use ($cutoff): void {
                        $query->whereNull('last_active_at')->where('created_at', '<=', $cutoff);
                    });
            });
    }

    private function purgeOldAppointments(DataManagementSetting $settings): int
    {
        $ids = Appointment::query()
            ->where('appointment_date', '<', now()->subYears($settings->retention_years))
            ->orderByDesc('id')
            ->pluck('id')
            ->all();

        return $this->purgeAppointments($ids);
    }

    /** @param list<int> $appointmentIds */
    private function purgeAppointments(array $appointmentIds): int
    {
        if ($appointmentIds === []) {
            return 0;
        }

        $deleted = 0;
        foreach (array_chunk($appointmentIds, 250) as $ids) {
            DB::transaction(function () use ($ids, &$deleted): void {
                $this->deleteWhereIn('onsite_service_queues', 'appointment_id', $ids);
                $this->deleteWhereIn('onsite_service_queues', 'bulk_appointment_id', $ids);
                $this->deleteWhereIn('onsite_event_staff', 'bulk_appointment_id', $ids);
                $this->deleteWhereIn('bulk_medical_reports', 'bulk_appointment_id', $ids);
                $this->deleteWhereIn('clinical_form_audits', 'appointment_id', $ids);
                $this->deleteWhereIn('diagnostic_results', 'appointment_id', $ids);
                $this->deleteWhereIn('medical_history', 'appointment_id', $ids);
                $this->deleteWhereIn('lab_results', 'appointment_id', $ids);
                $this->deleteWhereIn('xray_reports', 'appointment_id', $ids);
                $this->deleteWhereIn('physical_exams', 'appointment_id', $ids);
                $this->deleteWhereIn('medical_examinations', 'appointment_id', $ids);
                DB::table('appointments')->whereIn('released_from_appointment_id', $ids)->update(['released_from_appointment_id' => null]);
                $deleted += DB::table('appointments')->whereIn('id', $ids)->delete();
            });
        }

        return $deleted;
    }

    /** @param list<int> $ids */
    private function deleteWhereIn(string $table, string $column, array $ids): void
    {
        if (Schema::hasTable($table) && Schema::hasColumn($table, $column)) {
            DB::table($table)->whereIn($column, $ids)->delete();
        }
    }

    private function anonymizeReferencedAccount(User $user): void
    {
        $user->forceFill([
            'first_name' => 'Former',
            'middle_name' => null,
            'last_name' => ($user->role === 'patient' ? 'Patient ' : 'Staff ').$user->id,
            'position' => null,
            'email' => 'deleted+'.Str::uuid().'@retained.invalid',
            'contact' => null,
            'password' => Hash::make(Str::random(64)),
            'license_no' => null,
            'license_verification_status' => 'not_submitted',
            'license_document_path' => null,
            'license_document_back_path' => null,
            'license_verified_at' => null,
            'license_verified_by' => null,
            'license_rejection_reason' => null,
            'specialization' => null,
            'signature_path' => null,
            'availability' => null,
            'is_active' => false,
            'remember_token' => null,
            'retention_anonymized_at' => now(),
        ])->saveQuietly();
    }
}
