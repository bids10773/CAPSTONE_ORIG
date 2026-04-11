<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Delete existing admin user if exists
$existingAdmin = \App\Models\User::where('email', 'admin@lmic.com')->first();
if ($existingAdmin) {
    $existingAdmin->delete();
    echo "Existing admin user deleted.\n";
}

// Create admin user - do NOT hash manually, Laravel's 'hashed' cast will handle it
$admin = \App\Models\User::create([
    'first_name' => 'Admin',
    'middle_name' => '',
    'last_name' => 'User',
    'email' => 'admin@lmic.com',
    'contact' => '1234567890',
    'password' => 'admin123', // Laravel will hash this automatically due to 'hashed' cast
    'role' => 'admin',
    'is_active' => true,
    'email_verified_at' => now(),
]);

// ✅ PUT IT HERE
$admin->markEmailAsVerified();

echo "Admin user created successfully!\n";
echo "Email: admin@lmic.com\n";
echo "Password: admin123\n";
