<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

test('onsite event migration resumes from the Railway partial state', function () {
    Schema::dropIfExists('onsite_service_queues');
    Schema::dropIfExists('onsite_event_staff');

    // This is the state MySQL leaves when the table and its foreign keys are
    // created before the original overlong composite-index statement fails.
    Schema::create('onsite_event_staff', function (Blueprint $table) {
        $table->id();
        $table->foreignId('bulk_appointment_id')->constrained('appointments')->cascadeOnDelete();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('service_role', 20);
        $table->unsignedSmallInteger('queue_capacity')->default(10);
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });

    $migration = require database_path('migrations/2026_08_19_020000_create_onsite_event_workflow.php');

    $migration->up();
    $migration->up();

    $staffUniqueIndex = collect(Schema::getIndexes('onsite_event_staff'))
        ->first(fn (array $index): bool => $index['columns'] === [
            'bulk_appointment_id',
            'user_id',
            'service_role',
        ] && $index['unique']);

    expect($staffUniqueIndex)->not->toBeNull()
        ->and($staffUniqueIndex['name'])->toBe('onsite_staff_event_user_role_unique')
        ->and(strlen($staffUniqueIndex['name']))->toBeLessThanOrEqual(64)
        ->and(Schema::hasTable('onsite_service_queues'))->toBeTrue()
        ->and(Schema::hasIndex(
            'onsite_service_queues',
            ['appointment_id', 'service_role']
        ))->toBeTrue()
        ->and(Schema::hasIndex(
            'onsite_service_queues',
            ['bulk_appointment_id', 'service_role', 'status']
        ))->toBeTrue()
        ->and(Schema::hasIndex(
            'onsite_service_queues',
            ['assigned_staff_id', 'status']
        ))->toBeTrue();
});
