<?php

namespace App\Console\Commands;

use App\Services\ProductionAdminBootstrapService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use LogicException;
use Throwable;

class BootstrapAdmin extends Command
{
    protected $signature = 'app:bootstrap-admin
        {email? : Email address that will receive the administrator setup link}
        {--first-name=System : Administrator first name}
        {--last-name=Administrator : Administrator last name}';

    protected $description = 'Securely create the first production administrator and email a password setup link';

    public function handle(ProductionAdminBootstrapService $admins): int
    {
        if (! app()->environment(['production', 'testing'])) {
            $this->error('Use app:create-admin for local development. This command is limited to production bootstrapping.');

            return self::FAILURE;
        }

        $email = strtolower(trim((string) ($this->argument('email') ?: $this->ask('Administrator email'))));
        $firstName = trim((string) $this->option('first-name'));
        $lastName = trim((string) $this->option('last-name'));
        $validator = Validator::make(compact('email', 'firstName', 'lastName'), [
            'email' => ['required', 'email:rfc', 'max:255'],
            'firstName' => ['required', 'string', 'max:255'],
            'lastName' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::INVALID;
        }

        if (app()->environment('production') && ! $this->confirm(
            "Create the first production administrator for {$email}?",
            false,
        )) {
            $this->warn('Administrator bootstrap cancelled.');

            return self::FAILURE;
        }

        try {
            $admins->create($email, $firstName, $lastName);
        } catch (LogicException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        } catch (Throwable $exception) {
            report($exception);
            $this->error('The administrator could not be created or the setup email could not be delivered. No account was saved.');

            return self::FAILURE;
        }

        $this->info('The initial administrator was created successfully.');
        $this->line("A password setup link was sent to {$email}.");
        $this->warn('The link expires in 60 minutes. Complete email verification and enable two-factor authentication after signing in.');

        return self::SUCCESS;
    }
}
