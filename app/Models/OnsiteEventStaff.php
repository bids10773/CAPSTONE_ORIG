<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnsiteEventStaff extends Model
{
    protected $table = 'onsite_event_staff';

    protected $fillable = ['bulk_appointment_id', 'user_id', 'service_role', 'queue_capacity', 'is_active', 'assigned_by', 'assigned_at'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'assigned_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bulkAppointment()
    {
        return $this->belongsTo(Appointment::class, 'bulk_appointment_id');
    }
}
