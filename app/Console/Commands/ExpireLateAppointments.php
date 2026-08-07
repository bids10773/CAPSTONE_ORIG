<?php

namespace App\Console\Commands;

use App\Services\AppointmentSchedulingService;
use Illuminate\Console\Command;

class ExpireLateAppointments extends Command
{
    protected $signature = 'appointments:expire-late';

    protected $description = 'Cancel unattended online appointments after their grace period and release their slots';

    public function handle(AppointmentSchedulingService $scheduling): int
    {
        $count = $scheduling->expireLateAppointments();
        $this->info("Expired {$count} late appointment(s).");

        return self::SUCCESS;
    }
}
