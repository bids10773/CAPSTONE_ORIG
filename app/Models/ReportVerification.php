<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportVerification extends Model
{
    protected $fillable = ['source_type', 'source_id', 'token'];

    protected $hidden = ['token'];
}
