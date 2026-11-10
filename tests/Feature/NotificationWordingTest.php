<?php

use App\Models\Appointment;
use App\Models\User;
use App\Support\NotificationWording;

test('notification actor labels distinguish known people from unknown actors', function () {
    $user = User::factory()->create(['first_name' => 'Maya', 'middle_name' => null, 'last_name' => 'Reyes', 'role' => 'admin']);
    expect(NotificationWording::actor($user))->toBe('Maya Reyes (Administrator)')
        ->and(NotificationWording::by($user->id))->toBe(' by Maya Reyes (Administrator)')
        ->and(NotificationWording::actor(null))->toBeNull()
        ->and(NotificationWording::by(null))->toBe('')
        ->and(NotificationWording::actor(999999))->toBeNull();
});

test('notification roles and clinical stages use readable distinct labels', function () {
    expect(NotificationWording::role('medtech'))->toBe('Medical Technologist')
        ->and(NotificationWording::role('radtech'))->toBe('Radiologic Technologist')
        ->and(NotificationWording::status('for_final_evaluation'))->toBe('awaiting final evaluation')
        ->and(NotificationWording::status('ready_for_pickup'))->toBe('ready for pickup')
        ->and(NotificationWording::status('draft'))->toBe('draft')
        ->and(NotificationWording::status('released'))->toBe('released');
});

test('notification appointment context handles missing times without dangling words', function () {
    $appointment = new Appointment(['appointment_date' => '2026-11-06']);
    $appointment->id = 182;
    expect(NotificationWording::appointment($appointment))->toBe('appointment APT0182')
        ->and(NotificationWording::schedule($appointment))->toBe('Nov 6, 2026');
    $appointment->start_time = '09:00';
    expect(NotificationWording::schedule($appointment))->toBe('Nov 6, 2026 at 9:00 AM');
});

test('notification service names distinguish clinical tasks from staff roles', function () {
    expect(NotificationWording::service('final_evaluation'))->toBe('Final evaluation')
        ->and(NotificationWording::service('drug_verification'))->toBe('Drug test verification')
        ->and(NotificationWording::service('doctor'))->toBe('Physical examination')
        ->and(NotificationWording::service('radtech'))->toBe('X-ray');
});
