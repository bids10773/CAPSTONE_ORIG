<?php

namespace App\Support;

final class PhilippineContactNumber
{
    public static function normalize(?string $value): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $value);
        if ($digits === '') {
            return null;
        }
        if (str_starts_with($digits, '09') && strlen($digits) === 11) {
            return '63'.substr($digits, 1);
        }
        if (str_starts_with($digits, '9') && strlen($digits) === 10) {
            return '63'.$digits;
        }
        if (str_starts_with($digits, '639') && strlen($digits) === 12) {
            return $digits;
        }

        return null;
    }
}
