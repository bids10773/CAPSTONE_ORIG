<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$users = \App\Models\User::where('role', 'admin')->get(['id', 'email', 'first_name', 'last_name', 'role', 'is_active'])->toArray();

echo json_encode($users, JSON_PRETTY_PRINT);

