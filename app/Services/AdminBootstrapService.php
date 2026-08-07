<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use LogicException;

class AdminBootstrapService
{
    public function __construct(private StaffCredentialService $credentials) {}

    /** @return array{user: User, temporary_password: string|null, created: bool} */
    public function create(string $email, string $firstName = 'System', string $lastName = 'Administrator'): array
    {
        return DB::transaction(function () use ($email, $firstName, $lastName): array {
            $existing = User::query()->where('email', $email)->lockForUpdate()->first();

            if ($existing) {
                if ($existing->role !== 'admin') {
                    throw new LogicException('That email already belongs to a non-administrator account.');
                }

                return ['user' => $existing, 'temporary_password' => null, 'created' => false];
            }

            $temporaryPassword = $this->credentials->generateTemporaryPassword();
            $admin = User::create([
                'first_name' => $firstName,
                'middle_name' => null,
                'last_name' => $lastName,
                'email' => $email,
                'contact' => null,
                'password' => Hash::make($temporaryPassword),
                'role' => 'admin',
                'is_active' => true,
                'must_change_password' => true,
                'temporary_password_created_at' => now(),
                'temporary_password_expires_at' => now()->addHours(48),
            ]);
            $admin->markEmailAsVerified();

            return ['user' => $admin, 'temporary_password' => $temporaryPassword, 'created' => true];
        });
    }
}
