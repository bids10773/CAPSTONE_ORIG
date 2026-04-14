<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Delete existing admin user if exists
$existingInfostaff = \App\Models\User::where('email', 'infostaff@lmic.com')->first();
if ($existingInfostaff) {
    $existingInfostaff->delete();
    echo "Existing admin user deleted.\n";
}

// Create admin user - do NOT hash manually, Laravel's 'hashed' cast will handle it
$infostaff = \App\Models\User::create([
    'first_name' => 'Information',
    'middle_name' => '',
    'last_name' => 'Staff',
    'email' => 'infostaff@lmic.com',
    'contact' => '1234567890',
    'password' => 'infostaff123', // Laravel will hash this automatically due to 'hashed' cast
    'role' => 'info_staff',
    'is_active' => true,
    'email_verified_at' => now(),
]);

// ✅ PUT IT HERE
$infostaff->markEmailAsVerified();

echo "Information Staff user created successfully!\n";
echo "Email: infostaff@lmic.com\n";
echo "Password: infostaff123\n";
