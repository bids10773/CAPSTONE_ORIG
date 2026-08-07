<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (! $app->environment('local')) {
    fwrite(STDERR, "This compatibility script is available only when APP_ENV=local.\n");
    exit(1);
}

$email = strtolower(trim((string) ($argv[1] ?? '')));
if ($email === '') {
    fwrite(STDOUT, 'Administrator email: ');
    $email = strtolower(trim((string) fgets(STDIN)));
}

if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Enter a valid administrator email address.\n");
    exit(2);
}

$exitCode = Artisan::call('app:create-admin', ['email' => $email]);
fwrite($exitCode === 0 ? STDOUT : STDERR, Artisan::output());

exit($exitCode);
