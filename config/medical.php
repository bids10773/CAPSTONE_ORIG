<?php

return [
    'booking_security' => [
        'max_active_future_appointments' => 2,
        'booking_attempts_per_minute' => 5,
        'registration_attempts_per_minute' => 5,
        'blocked_attempt_threshold' => 5,
        'blocked_attempt_window_minutes' => 30,
        'cancellation_threshold' => 3,
        'cancellation_window_days' => 30,
    ],
    'clinic_hours' => [
        'opens_at' => '08:00',
        'closes_at' => '17:00',
        'slot_minutes' => 30,
    ],
    'pe_package' => [
        'pre_employment_services' => [
            'PE',
            'CBC',
            'Urinalysis',
            'Fecalysis',
            'X-Ray',
        ],
        'optional_bulk_services' => [
            'Drug Test',
            'Pregnancy Test',
        ],
    ],
];
