<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {     
    Role::create(['name'=>'admin']);
    Role::create(['name'=>'doctor']);
    Role::create(['name'=>'medtech']);
    Role::create(['name'=>'radtech']);
    Role::create(['name'=>'company']);
    Role::create(['name'=>'patient']);
}
    }
