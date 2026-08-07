<?php

namespace App\Services;

use App\Models\Appointment;

class LaboratoryFormDefinition
{
    public function sectionsFor(Appointment $appointment): array
    {
        $requested = collect($appointment->service_types ?? []);
        if ($appointment->isPePackage()) {
            $requested = $requested->merge(config('medical.pe_package.laboratory_services', []))->unique();
        }
        $sections = $this->sections();

        return collect($sections)->filter(function (array $section, string $key) use ($requested): bool {
            return $requested->contains(fn (string $service): bool => in_array($service, $section['services'], true));
        })->all();
    }

    public function sections(): array
    {
        return [
            'cbc' => ['label' => 'Complete Blood Count', 'column' => 'cbc_results', 'services' => ['CBC'], 'fields' => [
                $this->field('hemoglobin', 'Hemoglobin', 'number', 'g/dL', 'M 13–17; F 12–16'),
                $this->field('hematocrit', 'Hematocrit', 'number', null, 'M 0.39–0.53; F 0.36–0.46'),
                $this->field('rbc_count', 'RBC Count', 'number', '×10¹²/L', 'M 4.5–6.2; F 4.2–5.4'),
                $this->field('wbc_count', 'WBC Count', 'number', '×10⁹/L', '5.0–10.0'),
                $this->field('segmenters', 'Segmenters', 'number', null, '0.50–0.70'),
                $this->field('lymphocytes', 'Lymphocytes', 'number', null, '0.20–0.50'),
                $this->field('monocytes', 'Monocytes', 'number', null, '0.02–0.09'),
                $this->field('eosinophils', 'Eosinophils', 'number', null, '0.00–0.06'),
                $this->field('basophils', 'Basophils', 'number', null, '0.00–0.02'),
                $this->field('stab', 'Stab', 'number', null, '0.02–0.06'),
                $this->field('meta', 'Meta', 'number', null, '0.00–0.01'),
                $this->field('differential_others', 'Differential Others'),
                $this->field('platelet_count', 'Platelet Count', 'number', '×10⁹/L', '150–450'),
                $this->field('verification_note', 'Verification Note'),
            ]],
            'urinalysis' => ['label' => 'Urinalysis', 'column' => 'urinalysis_results', 'services' => ['Urinalysis'], 'fields' => [
                $this->field('color', 'Color', 'select', null, 'Straw–Amber', ['Straw', 'Yellow', 'Light Yellow', 'Dark Yellow', 'Amber', 'Reddish', 'Other']),
                $this->field('transparency', 'Transparency', 'select', null, 'Clear', ['Clear', 'Slightly Hazy', 'Hazy', 'Turbid']),
                $this->field('ph', 'Reaction / pH', 'number', null, '4.5–8.0'),
                $this->field('specific_gravity', 'Specific Gravity', 'number', null, '1.005–1.025'),
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
                $this->field('methamphetamine', 'Methamphetamine', 'select', null, null, ['Negative', 'Positive']),
                $this->field('tetrahydrocannabinol', 'Tetrahydrocannabinol (THC)', 'select', null, null, ['Negative', 'Positive']),
            ]],
            'serology' => ['label' => 'Serology', 'column' => 'serology_results', 'services' => ['Hepatitis'], 'fields' => [
                $this->field('hbsag', 'Hepatitis B Surface Antigen', 'select', null, null, ['Non-reactive', 'Reactive']),
                $this->field('anti_hav_igm', 'Hepatitis A Anti-HAV IgM', 'select', null, null, ['Non-reactive', 'Reactive']),
            ]],
            'pregnancy' => ['label' => 'Pregnancy Test', 'column' => 'pregnancy_test', 'services' => ['Pregnancy Test'], 'fields' => [
                $this->field('pregnancy_test', 'Urine Pregnancy Test', 'select', null, null, ['Negative', 'Positive']),
            ]],
            'blood_chemistry' => ['label' => 'Blood Chemistry', 'column' => 'blood_chemistry_results', 'services' => ['FBS', 'Blood Chemistry'], 'fields' => [
                $this->field('fbs', 'FBS', 'number', 'mg/dL', '75–115'), $this->field('cholesterol', 'Cholesterol', 'number', 'mg/dL', '<200'),
                $this->field('triglycerides', 'Triglycerides', 'number', 'mg/dL', '36–165'), $this->field('hdl', 'HDL', 'number', 'mg/dL', 'M 26–63; F 33–75'),
                $this->field('ldl', 'LDL', 'number', 'mg/dL', '63–175'), $this->field('bun', 'BUN', 'number', 'mg/dL', '10–50'),
                $this->field('creatinine', 'Creatinine', 'number', 'mg/dL', '0.7–2.0'), $this->field('sgot', 'SGOT', 'number', 'units/mL', '<40'),
                $this->field('sgpt', 'SGPT', 'number', 'units/mL', '<45'), $this->field('uric_acid', 'Uric Acid', 'number', 'mg/dL', '3.4–7.0'),
            ]],
            'blood_type' => ['label' => 'Blood Type', 'column' => 'blood_type', 'services' => ['Blood Typing'], 'fields' => [
                $this->field('blood_type', 'Blood Type', 'select', null, null, ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            ]],
        ];
    }

    private function field(string $key, string $label, string $type = 'text', ?string $unit = null, ?string $normal = null, array $options = []): array
    {
        return compact('key', 'label', 'type', 'unit', 'normal', 'options');
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
