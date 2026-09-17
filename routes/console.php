<?php

use App\Services\OpenMeteoWeatherService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('appointments:expire-late')->everyMinute()->withoutOverlapping();

Artisan::command('weather:sync-month {month : Completed month in YYYY-MM format}', function (string $month) {
    if (! preg_match('/^(\d{4})-(0[1-9]|1[0-2])$/', $month, $matches)) {
        $this->error('Provide a month in YYYY-MM format.');

        return 1;
    }

    try {
        $result = app(OpenMeteoWeatherService::class)->syncMonth((int) $matches[1], (int) $matches[2]);
        $this->info("Saved {$result['month']} historical weather; complete: ".($result['completeness']['complete'] ? 'yes' : 'no'));

        return 0;
    } catch (\Throwable $exception) {
        $this->error('Historical weather could not be synchronized: '.$exception->getMessage());

        return 1;
    }
})->purpose('Save a completed month of Open-Meteo historical weather separately from ML data');
