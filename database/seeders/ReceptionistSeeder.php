<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ReceptionistSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'first_name'        => 'Info',
            'last_name'         => 'Staff',
            'email'             => 'receptionist@lmic.com',
            'password'          => Hash::make('password'),
            'role'              => 'receptionist',
            'contact'           => '0090567570', // ← add this
            'is_active'         => true,
            'email_verified_at' => now(),
        ]);
    }
}