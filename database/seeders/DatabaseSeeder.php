<?php

namespace Database\Seeders;

use App\Services\AdminBootstrapService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! app()->environment('local')) {
            return;
        }

        $email = strtolower(trim((string) env('LOCAL_ADMIN_EMAIL')));
        if ($email === '') {
            return;
        }

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->command?->error('LOCAL_ADMIN_EMAIL is invalid; the local administrator was not created.');

            return;
        }

        $result = app(AdminBootstrapService::class)->create(
            $email,
            (string) env('LOCAL_ADMIN_FIRST_NAME', 'System'),
            (string) env('LOCAL_ADMIN_LAST_NAME', 'Administrator'),
        );

        if (! $result['created']) {
            $this->command?->info('The configured local administrator already exists; no changes were made.');

            return;
        }

        $this->command?->info("Local administrator created for {$email}.");
        $this->command?->warn("Temporary password: {$result['temporary_password']}");
        $this->command?->warn('Change it at first login; it expires in 48 hours.');
    }
}
