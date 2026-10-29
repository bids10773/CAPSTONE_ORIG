<?php

namespace App\Services;

use App\Models\BulkMedicalReport;
use App\Models\LabResult;
use App\Models\MedicalExamination;
use App\Models\ReportVerification;
use App\Models\XrayReport;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ReportVerificationService
{
    private const TYPES = [
        'laboratory' => [LabResult::class, 'Laboratory report', 'LAB'],
        'xray' => [XrayReport::class, 'X-ray report', 'XRAY'],
        'examination' => [MedicalExamination::class, 'Medical examination report', 'EXAM'],
        'company_bulk' => [BulkMedicalReport::class, 'Company bulk report', 'BULK'],
    ];

    public function documentData(?Model $report): array
    {
        $report = $report?->exists ? $report->fresh() : null;
        if (! $report || ! $this->isOfficial($report)) {
            return [];
        }
        $type = collect(self::TYPES)->search(fn (array $type) => $report instanceof $type[0]);
        if ($type === false) {
            return [];
        }
        $verification = ReportVerification::firstOrCreate(['source_type' => $type, 'source_id' => $report->id], ['token' => Str::random(64)]);

        return app(CertificateVerificationService::class)->linkData('reports.verify', $verification->token)
            + ['verificationReference' => self::TYPES[$type][2].'-'.$report->id];
    }

    public function publicData(ReportVerification $verification): ?array
    {
        $type = self::TYPES[$verification->source_type] ?? null;
        $report = $type ? $type[0]::find($verification->source_id) : null;
        if (! $report) {
            return null;
        }
        $official = $this->isOfficial($report);
        $bulk = $report instanceof BulkMedicalReport;
        $name = $bulk ? $report->company?->company_name : $report->appointment?->user?->name;
        $date = match (true) {
            $report instanceof LabResult => $report->finalized_at,
            $report instanceof XrayReport => $report->verified_at,
            default => $report->released_at,
        };
        $signer = match (true) {
            $report instanceof LabResult => ($report->verifiedBy ?? $report->encodedBy)?->name,
            $report instanceof XrayReport => ($report->verifiedBy ?? $report->radiologist)?->name,
            $report instanceof MedicalExamination => ($report->finalizedBy ?? $report->examiningDoctor)?->name,
            default => 'Living Myth Medical Clinic',
        };

        return [
            'documentLabel' => $type[1], 'holderLabel' => $bulk ? 'Company (masked)' : 'Patient (masked)',
            'number' => $type[2].'-'.$report->id,
            'patient' => collect(preg_split('/\s+/u', trim($name ?? '')) ?: [])->filter()
                ->map(fn (string $part) => Str::substr($part, 0, 1).str_repeat('*', max(1, Str::length($part) - 1)))->implode(' '),
            'physician' => $signer, 'issuedDate' => $date?->format('F j, Y'), 'valid' => $official,
            'status' => ! $official ? 'Withdrawn' : match ($verification->source_type) {
                'laboratory' => 'Finalized', 'xray' => 'Verified', default => 'Released',
            },
        ];
    }

    private function isOfficial(Model $report): bool
    {
        if ($report instanceof BulkMedicalReport) {
            return $report->status === 'released' && $report->released_at !== null
                && $report->bulkAppointment !== null
                && ! in_array($report->bulkAppointment?->status, ['cancelled', 'rejected'], true);
        }
        if (! ($report instanceof LabResult || $report instanceof XrayReport || $report instanceof MedicalExamination)) {
            return false;
        }
        $appointment = $report->appointment;
        if (! $appointment || in_array($appointment->status, ['cancelled', 'rejected', 'absent'], true)) {
            return false;
        }
        if ($report instanceof MedicalExamination) {
            return $report->finalized_at !== null && $report->released_at !== null;
        }
        if ($appointment->isPePackage() && $appointment->medicalExamination?->released_at === null) {
            return false;
        }
        if ($report instanceof XrayReport) {
            return $report->isVerified();
        }
        if (in_array('Drug Test', $appointment->service_types ?? [], true)
            && ! $appointment->medicalExamination?->diagnosticResults()->where('service_key', 'drug_test')->first()?->isVerified()) {
            return false;
        }

        return $report->isFinalized();
    }
}
