<?php

namespace App\Support;

use Carbon\CarbonInterface;

class ClinicHours
{
    public static function timezone(): string
    {
        return config('medical.clinic_hours.timezone', 'Asia/Manila');
    }

    public static function now(): CarbonInterface
    {
        return now(self::timezone());
    }

    public static function today(): string
    {
        return self::now()->toDateString();
    }

    public static function isBookableDate(string $date): bool
    {
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return false;
        }

        $now = self::now();
        $today = $now->toDateString();

        return $date > $today || ($date === $today && $now->format('H:i') < config('medical.clinic_hours.closes_at', '17:00'));
    }

    public static function publicSettings(): array
    {
        return [
            'timezone' => self::timezone(),
            'opensAt' => config('medical.clinic_hours.opens_at', '08:00'),
            'closesAt' => config('medical.clinic_hours.closes_at', '17:00'),
            'workingDays' => config('medical.clinic_hours.working_days', ['mon', 'tue', 'wed', 'thu', 'fri']),
            'serverNow' => self::now()->toIso8601String(),
        ];
    }
}
