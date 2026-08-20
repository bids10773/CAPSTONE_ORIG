<?php

namespace App\Models;

use App\Services\LaboratoryFormDefinition;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MedicalExamination extends Model
{
    protected $fillable = [
        'appointment_id', 'examining_doctor_id', 'examination_date', 'status',
        'medical_classification', 'fit_to_work', 'final_diagnosis', 'final_remarks',
        'recommendations', 'finalized_by', 'finalized_at', 'company_id', 'batch_id',
        'released_by', 'released_at',
    ];

    protected function casts(): array
    {
        return [
            'examination_date' => 'date',
            'fit_to_work' => 'boolean',
            'finalized_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function examiningDoctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'examining_doctor_id');
    }

    public function finalizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function releasedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }

    public function diagnosticResults(): HasMany
    {
        return $this->hasMany(DiagnosticResult::class);
    }

    public function physicalExam(): HasOne
    {
        return $this->hasOne(PhysicalExam::class);
    }

    public function medicalHistory(): HasOne
    {
        return $this->hasOne(MedicalHistory::class);
    }

    public function laboratoryResult(): HasOne
    {
        return $this->hasOne(LabResult::class);
    }

    public function xrayReport(): HasOne
    {
        return $this->hasOne(XrayReport::class);
    }

    public function childSummaries(): array
    {
        $appointment = $this->appointment;
        $lab = $this->laboratoryResult;
        $diagnostics = $this->diagnosticResults->keyBy('service_key');
        $summaries = [];

        if (in_array('PE', $appointment->service_types ?? [], true)) {
            $summaries[] = $this->summary('physical_exam', 'Physical Examination',
                $this->physicalExam?->is_completed ? 'completed' : 'pending',
                $this->physicalExam?->remarks ?: ($this->physicalExam ? 'Examination recorded' : 'Awaiting examination'));
        }

        foreach (app(LaboratoryFormDefinition::class)->sectionsFor($appointment) as $key => $definition) {
            $diagnostic = $diagnostics->get($key);
            $result = $lab?->{$definition['column']};
            $completed = $diagnostic?->isVerified() ?? (filled($result) && $lab?->isFinalized() && $key !== 'drug_test');
            $status = $completed ? 'completed' : match ($diagnostic?->status) {
                'verifying', 'awaiting_official_result', 'official_result_received' => 'awaiting_result',
                'in_progress' => 'draft',
                default => 'pending',
            };
            $summary = $key === 'drug_test' && $status === 'awaiting_result'
                ? 'Specimen collected — awaiting official result'
                : (filled($result) ? $this->resultSummary($result) : 'Awaiting result');
            $summaries[] = $this->summary($key, $definition['label'], $status, $summary);
        }

        if ($appointment->requiresXray()) {
            $summaries[] = $this->summary('xray', 'Chest X-Ray',
                $this->xrayReport?->isVerified() ? 'completed' : ($this->xrayReport?->performed_at ? 'draft' : 'pending'),
                $this->xrayReport?->impression ?: ($this->xrayReport?->performed_at ? 'Performed — awaiting official result' : 'Awaiting procedure'));
        }

        foreach (['ECG', 'Audiometry', 'Neuro Psychiatric Test'] as $service) {
            if (in_array($service, $appointment->service_types ?? [], true)) {
                $summaries[] = $this->summary(str($service)->snake()->toString(), $service, 'pending', 'Form integration pending');
            }
        }

        return $summaries;
    }

    public function isReadyForFinalEvaluation(): bool
    {
        $summaries = $this->childSummaries();

        return $summaries !== []
            && collect($summaries)->every(fn (array $summary): bool => $summary['status'] === 'completed');
    }

    private function summary(string $key, string $label, string $status, string $summary): array
    {
        return compact('key', 'label', 'status', 'summary');
    }

    private function resultSummary(mixed $result): string
    {
        $values = is_array($result) ? collect($result)->filter(fn ($value) => filled($value)) : collect([$result]);

        return $values->isEmpty() ? 'No result recorded' : 'Result available';
    }
}
