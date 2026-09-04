<?php

namespace App\Services;

use App\Models\Appointment;

class LaboratoryFormDefinition
{
    public function sectionsFor(Appointment $appointment): array
    {
        $appointment->loadMissing('user.patientProfile');
        $requested = collect($appointment->service_types ?? []);
        $sections = $this->sections();

        return collect($sections)->filter(function (array $section, string $key) use ($requested, $appointment): bool {
            if ($key === 'pregnancy' && $appointment->user?->role === 'patient' && ! $this->isFemale($appointment)) {
                return false;
            }

            return $requested->contains(fn (string $service): bool => in_array($service, $section['services'], true));
        })->all();
    }

    private function isFemale(Appointment $appointment): bool
    {
        $sex = $appointment->user?->patientProfile?->sex ?? $appointment->user?->sex;

        return in_array(strtolower(trim((string) $sex)), ['female', 'f'], true);
    }

    public function sections(): array
    {
        return [
            'cbc' => ['label' => 'Complete Blood Count', 'column' => 'cbc_results', 'services' => ['CBC'], 'fields' => [
                $this->numberField('hemoglobin', 'Hemoglobin', 'g/dL', 'M 13–17; F 12–16', 0, 30, 2, ['male' => [13, 17], 'female' => [12, 16]]),
                $this->numberField('hematocrit', 'Hematocrit', null, 'M 0.39–0.53; F 0.36–0.46', 0, 1, 3, ['male' => [0.39, 0.53], 'female' => [0.36, 0.46]]),
                $this->numberField('rbc_count', 'RBC Count', '×10¹²/L', 'M 4.5–6.2; F 4.2–5.4', 0, 20, 2, ['male' => [4.5, 6.2], 'female' => [4.2, 5.4]]),
                $this->numberField('wbc_count', 'WBC Count', '×10⁹/L', '5.0–10.0', 0, 500, 2, ['default' => [5, 10]]),
                $this->numberField('segmenters', 'Segmenters', null, '0.50–0.70', 0, 1, 2, ['default' => [0.5, 0.7]]),
                $this->numberField('lymphocytes', 'Lymphocytes', null, '0.20–0.50', 0, 1, 2, ['default' => [0.2, 0.5]]),
                $this->numberField('monocytes', 'Monocytes', null, '0.02–0.09', 0, 1, 2, ['default' => [0.02, 0.09]]),
                $this->numberField('eosinophils', 'Eosinophils', null, '0.00–0.06', 0, 1, 2, ['default' => [0, 0.06]]),
                $this->numberField('basophils', 'Basophils', null, '0.00–0.02', 0, 1, 2, ['default' => [0, 0.02]]),
                $this->numberField('stab', 'Stab', null, '0.02–0.06', 0, 1, 2, ['default' => [0.02, 0.06]]),
                $this->numberField('meta', 'Meta', null, '0.00–0.01', 0, 1, 2, ['default' => [0, 0.01]]),
                $this->field('differential_others', 'Differential Others'),
                $this->numberField('platelet_count', 'Platelet Count', '×10⁹/L', '150–450', 0, 2000, 2, ['default' => [150, 450]]),
                $this->field('verification_note', 'Verification Note'),
            ]],
            'urinalysis' => ['label' => 'Urinalysis', 'column' => 'urinalysis_results', 'services' => ['Urinalysis'], 'fields' => [
                $this->field('color', 'Color', 'select', null, 'Straw–Amber', ['Straw', 'Yellow', 'Light Yellow', 'Dark Yellow', 'Amber', 'Reddish', 'Other']),
                $this->field('transparency', 'Transparency', 'select', null, 'Clear', ['Clear', 'Slightly Hazy', 'Hazy', 'Turbid']),
                $this->numberField('ph', 'Reaction / pH', null, '4.5–8.0', 0, 14, 2, ['default' => [4.5, 8]]),
                $this->numberField('specific_gravity', 'Specific Gravity', null, '1.005–1.025', 1, 1.1, 3, ['default' => [1.005, 1.025]]),
                $this->field('glucose', 'Glucose / Sugar', 'select', null, 'Negative', $this->semiQuantitative()),
                $this->field('albumin', 'Albumin / Protein', 'select', null, 'Negative', $this->semiQuantitative()),
                $this->field('wbc', 'WBC', 'text', '/HPF', '0–2/HPF'),
                $this->field('rbc', 'RBC', 'text', '/HPF', '0–2/HPF'),
                $this->field('bacteria', 'Bacteria', 'select', null, 'None', $this->quantityOptions()),
                $this->field('epithelial_cells', 'Epithelial Cells', 'select', null, 'Few', $this->quantityOptions()),
                $this->field('mucus_threads', 'Mucus Threads', 'select', null, 'Few', $this->quantityOptions()),
                $this->field('amorphous_urates', 'Amorphous Urates', 'select', null, 'None', $this->quantityOptions()),
                $this->field('yeast_cells', 'Yeast Cells'), $this->field('calcium_oxalate', 'Calcium Oxalate'),
                $this->field('trichomonas', 'Trichomonas Vaginalis'), $this->field('casts', 'Casts'),
                $this->field('crystals', 'Crystals'), $this->field('others', 'Others'),
            ]],
            'fecalysis' => ['label' => 'Fecalysis', 'column' => 'fecalysis_results', 'services' => ['Fecalysis'], 'fields' => [
                $this->field('color', 'Color'), $this->field('consistency', 'Consistency', 'select', null, null, ['Formed', 'Semi-formed', 'Watery', 'Other']),
                $this->field('pus_cells', 'Pus Cells', 'text', '/HPF'), $this->field('rbc', 'RBC', 'text', '/HPF'),
                $this->field('yeast_cells', 'Yeast Cells'), $this->field('bacteria', 'Bacteria'),
                $this->field('parasite', 'Parasite / Ova'), $this->field('others', 'Others'),
            ]],
            'drug_test' => ['label' => 'Drug Test', 'column' => 'drug_test_results', 'services' => ['Drug Test'], 'fields' => [
                $this->field('methamphetamine', 'Methamphetamine', 'select', null, null, ['Negative', 'Positive', 'Pending']),
                $this->field('tetrahydrocannabinol', 'Marijuana / THC', 'select', null, null, ['Negative', 'Positive', 'Pending']),
            ]],
            'serology' => ['label' => 'Serology', 'column' => 'serology_results', 'services' => ['Hepatitis'], 'fields' => [
                $this->field('hbsag', 'Hepatitis B Surface Antigen', 'select', null, null, ['Non-reactive', 'Reactive']),
                $this->field('anti_hav_igm', 'Hepatitis A Anti-HAV IgM', 'select', null, null, ['Non-reactive', 'Reactive']),
            ]],
            'pregnancy' => ['label' => 'Pregnancy Test', 'column' => 'pregnancy_test', 'services' => ['Pregnancy Test'], 'fields' => [
                $this->field('pregnancy_test', 'Urine Pregnancy Test', 'select', null, null, ['Negative', 'Positive']),
            ]],
            'blood_chemistry' => ['label' => 'Blood Chemistry', 'column' => 'blood_chemistry_results', 'services' => ['FBS', 'Blood Chemistry'], 'fields' => [
                $this->numberField('fbs', 'FBS', 'mg/dL', '75–115', 0, 2000, 2, ['default' => [75, 115]]),
                $this->numberField('cholesterol', 'Cholesterol', 'mg/dL', '<200', 0, 2000, 2, ['default' => [null, 199.99]]),
                $this->numberField('triglycerides', 'Triglycerides', 'mg/dL', '36–165', 0, 5000, 2, ['default' => [36, 165]]),
                $this->numberField('hdl', 'HDL', 'mg/dL', 'M 26–63; F 33–75', 0, 500, 2, ['male' => [26, 63], 'female' => [33, 75]]),
                $this->numberField('ldl', 'LDL', 'mg/dL', '63–175', 0, 2000, 2, ['default' => [63, 175]]),
                $this->numberField('bun', 'BUN', 'mg/dL', '10–50', 0, 500, 2, ['default' => [10, 50]]),
                $this->numberField('creatinine', 'Creatinine', 'mg/dL', '0.7–2.0', 0, 100, 3, ['default' => [0.7, 2]]),
                $this->numberField('sgot', 'SGOT', 'units/mL', '<40', 0, 10000, 2, ['default' => [null, 39.99]]),
                $this->numberField('sgpt', 'SGPT', 'units/mL', '<45', 0, 10000, 2, ['default' => [null, 44.99]]),
                $this->numberField('uric_acid', 'Uric Acid', 'mg/dL', '3.4–7.0', 0, 100, 2, ['default' => [3.4, 7]]),
            ]],
            'blood_type' => ['label' => 'Blood Type', 'column' => 'blood_type', 'services' => ['Blood Typing'], 'fields' => [
                $this->field('blood_type', 'Blood Type', 'select', null, null, ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            ]],
        ];
    }

    private function field(string $key, string $label, string $type = 'text', ?string $unit = null, ?string $normal = null, array $options = [], ?array $validation = null, array $reference = []): array
    {
        return compact('key', 'label', 'type', 'unit', 'normal', 'options', 'validation', 'reference');
    }

    private function numberField(string $key, string $label, ?string $unit, string $normal, float $min, float $max, int $decimals, array $reference): array
    {
        return $this->field($key, $label, 'number', $unit, $normal, [], compact('min', 'max', 'decimals'), $reference);
    }

    private function semiQuantitative(): array
    {
        return ['Negative', 'Trace', '1+', '2+', '3+', '4+'];
    }

    private function quantityOptions(): array
    {
        return ['None', 'Rare', 'Few', 'Moderate', 'Many'];
    }
}
