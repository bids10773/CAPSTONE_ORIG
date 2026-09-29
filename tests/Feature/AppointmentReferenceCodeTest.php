<?php

use App\Models\Appointment;
use App\Models\User;

test('appointment reference codes use a prefix based on visit type', function () {
    $patient = User::factory()->create(['role' => 'patient']);

    foreach ([
        'individual' => 'APT',
        'walk_in' => 'WLK',
        'company_referral' => 'REF',
    ] as $type => $prefix) {
        $appointment = Appointment::create([
            'user_id' => $patient->id,
            'appointment_date' => today(),
            'type' => $type,
            'status' => 'accepted',
            'service_types' => ['PE'],
        ]);

        expect($appointment->reference_code)
            ->toBe($prefix.str_pad((string) $appointment->id, 4, '0', STR_PAD_LEFT))
            ->and($appointment->toArray()['reference_code'])
            ->toBe($appointment->reference_code);
    }
});
