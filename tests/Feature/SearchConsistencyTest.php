<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

test('staff management includes current session presence', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $onlineStaff = User::factory()->create([
        'role' => 'doctor',
        'email' => 'online.staff@example.com',
    ]);
    $offlineStaff = User::factory()->create([
        'role' => 'medtech',
        'email' => 'offline.staff@example.com',
    ]);

    DB::table('sessions')->insert([
        'id' => 'online-staff-session',
        'user_id' => $onlineStaff->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Feature test',
        'payload' => '',
        'last_activity' => now()->timestamp,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.staff.index', ['search' => 'online.staff@example.com']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('staff.data', 1)
            ->where('staff.data.0.id', $onlineStaff->id)
            ->where('staff.data.0.is_online', true)
            ->where('staff.data.0.last_active_at', fn ($value) => is_string($value)));

    $this->actingAs($admin)
        ->get(route('admin.staff.index', ['search' => 'offline.staff@example.com']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('staff.data', 1)
            ->where('staff.data.0.id', $offlineStaff->id)
            ->where('staff.data.0.is_online', false)
            ->where('staff.data.0.last_active_at', null));
});

test('admin staff search uses the canonical contact column', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $staff = User::factory()->create([
        'role' => 'doctor',
        'contact' => '09171234567',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.staff.index', ['search' => '1234567']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/staff/index')
            ->has('staff.data', 1)
            ->where('staff.data.0.id', $staff->id));
});

test('staff and receptionist searches reject oversized terms', function () {
    $oversized = str_repeat('x', 101);
    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin)
        ->get(route('admin.staff.index', ['search' => $oversized]))
        ->assertSessionHasErrors('search');

    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $this->actingAs($receptionist)
        ->get(route('receptionist.queue.index', ['search' => $oversized]))
        ->assertSessionHasErrors('search');
});
