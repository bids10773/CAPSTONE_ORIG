<?php

use App\Models\User;

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
