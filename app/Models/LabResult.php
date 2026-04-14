<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabResult extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'appointment_id',
        'encoded_by',
        
        // CBC
        'hemoglobin',
        'hematocrit',
        'wbc_count',
        'rbc_count',
        'platelet',
        
        // CBC Differential
        'segmenters',
        'lymphocytes',
        'monocytes',
        'eosinophils',
        'basophils',
        
        // Urinalysis - Physical
        'uri_color',
        'uri_transparency',
        
        // Urinalysis - Chemical
        'uri_ph',
        'uri_sp_gravity',
        'uri_sugar',
        'uri_protein',
        
        // Urinalysis - Microscopic
        'uri_wbc',
        'uri_rbc',
        'uri_bacteria',
        'uri_epithelial_cells',
        
        // Fecalysis
        'fecal_color',
        'fecal_consistency',
        'fecal_pus_cells',
        'fecal_rbc',
        'fecal_parasites',
        
        // Drug Tests
        'drug_test_shabu',
        'drug_test_thc',
        
        // Hepatitis
        'hepa_b_sag',
        'hepa_b_cab',
        
        // Pregnancy
        'pregnancy_test',
        
        // FBS
        'fbs',
        
    ];

    /**
     * Get the appointment that owns the lab result.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the user (MedTech) who encoded this result.
     */
    public function encodedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'encoded_by');
    }

    /**
     * Get normal values for reference.
     */
    public static function getNormalValues(): array
    {
        return [
            'hemoglobin' => ['male' => '13.5-17.5 g/dL', 'female' => '12.0-16.0 g/dL'],
            'hematocrit' => ['male' => '38.8-50.0%', 'female' => '34.9-44.5%'],
            'wbc_count' => ['normal' => '4,500-11,000 /cumm'],
            'rbc_count' => ['male' => '4.5-5.5 million/cumm', 'female' => '4.0-5.0 million/cumm'],
            'platelet' => ['normal' => '150,000-400,000 /cumm'],
            'segmenters' => ['normal' => '40-70%'],
            'lymphocytes' => ['normal' => '20-40%'],
            'monocytes' => ['normal' => '2-10%'],
            'eosinophils' => ['normal' => '1-6%'],
            'basophils' => ['normal' => '0-2%'],
            'uri_ph' => ['normal' => '4.5-8.0'],
            'uri_sp_gravity' => ['normal' => '1.005-1.030'],
            'fbs' => ['normal' => '70-100 mg/dL'],
        ];
    }
}
