<?php

namespace App\Console\Commands;

use App\Services\AdminBootstrapService;
use Illuminate\Console\Command;
use LogicException;

class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin
        {email? : Email address for the new administrator}
        {--first-name=System : Administrator first name}
        {--last-name=Administrator : Administrator last name}';

    protected $description = 'Create a local administrator with an expiring temporary password';

    public function handle(AdminBootstrapService $admins): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('Administrator bootstrapping is disabled outside local and testing environments.');

            return self::FAILURE;
        }

        $email = strtolower(trim((string) ($this->argument('email') ?: $this->ask('Administrator email'))));
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Enter a valid administrator email address.');

            return self::INVALID;
        }

        try {
            $result = $admins->create(
                $email,
                trim((string) $this->option('first-name')),
                trim((string) $this->option('last-name')),
            );
        } catch (LogicException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        if (! $result['created']) {
            $this->info('An administrator with that email already exists. No changes were made.');

            return self::SUCCESS;
        }

        $this->info('Administrator created successfully.');
        $this->line("Email: {$result['user']->email}");
        $this->warn("Temporary password: {$result['temporary_password']}");
        $this->warn('This password expires in 48 hours and must be changed at first login.');

        return self::SUCCESS;
    }
}
