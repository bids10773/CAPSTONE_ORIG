<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnsiteServiceQueue extends Model
{
    protected $fillable = ['bulk_appointment_id', 'appointment_id', 'service_role', 'assigned_staff_id', 'status', 'assigned_at', 'started_at', 'completed_at', 'hold_reason'];

    protected function casts(): array
    {
        return ['assigned_at' => 'datetime', 'started_at' => 'datetime', 'completed_at' => 'datetime'];
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function assignedStaff()
    {
        return $this->belongsTo(User::class, 'assigned_staff_id');
    }

    public function bulkAppointment()
    {
        return $this->belongsTo(Appointment::class, 'bulk_appointment_id');
    }
}
