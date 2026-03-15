<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class XrayReport extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'appointment_id',
        'radiologist_id',
        
        // X-Ray Details
        'view',
        'findings',
        'impression',
        
        // Status
        'is_completed',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
        ];
    }

    /**
     * Get the appointment that owns the x-ray report.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the radiologist who created the report.
     */
    public function radiologist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'radiologist_id');
    }

    /**
     * Get available X-ray views.
     */
    public static function getViewOptions(): array
    {
        return [
            'Chest PA' => 'Chest PA (Posteroanterior)',
            'Chest AP' => 'Chest AP (Anteroposterior)',
            'Chest Lateral' => 'Chest Lateral',
            'Chest Both Oblique' => 'Chest Both Oblique',
            'Skull AP' => 'Skull AP',
            'Skull Lateral' => 'Skull Lateral',
            'Lumbar Spine AP' => 'Lumbar Spine AP',
            'Lumbar Spine Lateral' => 'Lumbar Spine Lateral',
            'Cervical Spine AP' => 'Cervical Spine AP',
            'Cervical Spine Lateral' => 'Cervical Spine Lateral',
            'Knee AP' => 'Knee AP',
            'Knee Lateral' => 'Knee Lateral',
            'Shoulder AP' => 'Shoulder AP',
            'Pelvis AP' => 'Pelvis AP',
            'Abdominal Flat' => 'Abdominal Flat',
        ];
    }
}
