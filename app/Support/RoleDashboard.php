<?php

namespace App\Support;

final class RoleDashboard
{
    public static function path(string $role): string
    {
        return match ($role) {
            'admin' => '/admin/dashboard',
            'doctor' => '/doctor/dashboard',
            'medtech' => '/medtech/dashboard',
            'radtech' => '/radtech/dashboard',
            'company' => '/company/dashboard',
            'receptionist' => '/receptionist/dashboard',
            default => '/dashboard',
        };
    }
}
