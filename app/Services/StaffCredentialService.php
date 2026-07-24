<?php

namespace App\Services;

use App\Mail\StaffTemporaryCredentials;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class StaffCredentialService
{
    public function generateTemporaryPassword(int $length = 16): string
    {
        $groups = [
            'ABCDEFGHJKLMNPQRSTUVWXYZ',
            'abcdefghijkmnopqrstuvwxyz',
            '23456789',
            '!@#$%&*?',
        ];

        $characters = array_map(
            fn (string $group): string => $group[random_int(0, strlen($group) - 1)],
            $groups,
        );
        $pool = implode('', $groups);

        while (count($characters) < $length) {
            $characters[] = $pool[random_int(0, strlen($pool) - 1)];
        }

        for ($index = count($characters) - 1; $index > 0; $index--) {
            $swapIndex = random_int(0, $index);
            [$characters[$index], $characters[$swapIndex]] = [$characters[$swapIndex], $characters[$index]];
        }

        return implode('', $characters);
    }

    public function send(User $staff, string $temporaryPassword): void
    {
        Mail::to($staff->email)->send(
            new StaffTemporaryCredentials($staff, $temporaryPassword),
        );
    }
}
