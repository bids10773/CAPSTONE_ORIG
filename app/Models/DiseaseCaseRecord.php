<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiseaseCaseRecord extends Model
{
    protected $fillable = ['disease_name', 'record_month', 'case_count'];

    protected function casts(): array
    {
        return [
            'record_month' => 'date',
            'case_count' => 'integer',
        ];
    }
}
