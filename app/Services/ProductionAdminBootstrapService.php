<?php

namespace App\Services;

use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use LogicException;
use RuntimeException;

class ProductionAdminBootstrapService
{
    public function create(string $email, string $firstName, string $lastName): User
    {
        return DB::transaction(function () use ($email, $firstName, $lastName): User {
            if (User::query()->where('role', 'admin')->lockForUpdate()->exists()) {
                throw new LogicException('An administrator already exists. Use the authenticated account-management or password-reset workflow instead.');
            }

            if (User::query()->where('email', $email)->lockForUpdate()->exists()) {
                throw new LogicException('That email already belongs to an existing account.');
            }

            $admin = User::query()->create([
                'first_name' => $firstName,
                'middle_name' => null,
                'last_name' => $lastName,
                'email' => $email,
                'contact' => null,
                'password' => Hash::make(Str::random(64)),
                'role' => 'admin',
                'is_active' => true,
                'email_verified_at' => null,
                'must_change_password' => false,
                'temporary_password_created_at' => null,
                'temporary_password_expires_at' => null,
            ]);

            $status = Password::sendResetLink(['email' => $email]);

            if ($status !== Password::RESET_LINK_SENT) {
                throw new RuntimeException("The administrator setup email could not be sent: {$status}");
            }

            SecurityAudit::query()->create([
                'actor_id' => null,
                'target_user_id' => $admin->id,
                'action' => 'initial_admin_bootstrapped',
                'status' => 'pending_setup',
                'metadata' => [
                    'source' => 'artisan',
                    'environment' => app()->environment(),
                ],
            ]);

            return $admin;
        }, 3);
    }
}
