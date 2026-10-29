<?php

use App\Models\User;
use App\Services\WorkflowNotificationService;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

test('workflow alerts reach active admins and deduplicate explicitly targeted users', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $inactive = User::factory()->create(['role' => 'admin', 'is_active' => false]);
    $patient = User::factory()->create(['role' => 'patient']);
    $other = User::factory()->create(['role' => 'patient']);
    $sender = app(WorkflowNotificationService::class);
    $sender->admins('test_activity', 'Activity recorded', 'A workflow activity was recorded.', '/notifications');
    $sender->users([$patient, $patient->id, $inactive], 'test_activity', 'Update', 'Your record was updated.', '/notifications');
    expect($admin->notifications()->count())->toBe(1)
        ->and($patient->notifications()->count())->toBe(1)
        ->and($inactive->notifications()->count())->toBe(0)
        ->and($other->notifications()->count())->toBe(0)
        ->and($admin->notifications()->first()->data['recipient_role'])->toBe('admin')
        ->and($patient->notifications()->first()->data['recipient_role'])->toBe('patient');
});

test('rolled back workflows do not send notifications', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    try {
        DB::transaction(function () {
            app(WorkflowNotificationService::class)->admins('rolled_back', 'Update', 'No committed activity.', '/notifications');
            throw new RuntimeException('Rollback test');
        });
    } catch (RuntimeException) {
    }
    expect($admin->notifications()->count())->toBe(0);
});

test('a recipient who changes role before commit cannot receive the former role alert', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    DB::transaction(function () use ($admin) {
        app(WorkflowNotificationService::class)->admins('admin_only', 'Admin update', 'Administrator activity.', '/admin/dashboard');
        $admin->update(['role' => 'patient']);
    });
    expect($admin->notifications()->count())->toBe(0);
});

test('a company recipient moved before commit cannot receive the former company alert', function () {
    $company = \App\Models\Company::create(['company_name' => 'First', 'status' => 'active']);
    $other = \App\Models\Company::create(['company_name' => 'Other', 'status' => 'active']);
    $owner = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    DB::transaction(function () use ($owner, $other) {
        app(WorkflowNotificationService::class)->users([$owner], 'company_update', 'Company update', 'Company event updated.', '/company/dashboard');
        $owner->update(['company_id' => $other->id]);
    });
    expect($owner->notifications()->count())->toBe(0);
});

test('a delivery failure cannot block other recipients or the business operation', function () {
    $first = User::factory()->create(['role' => 'admin']);
    $second = User::factory()->create(['role' => 'admin']);
    Event::listen(NotificationSent::class, function (NotificationSent $event) use ($first) {
        if ($event->notifiable->id === $first->id) {
            throw new RuntimeException('Simulated transport failure');
        }
    });
    app(WorkflowNotificationService::class)->users([$first, $second], 'test_activity', 'Update', 'Committed activity.', '/notifications');
    expect($second->notifications()->count())->toBe(1);
});
