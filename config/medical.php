<?php

return [
    'clinic_hours' => [
        'opens_at' => '08:00',
        'closes_at' => '17:00',
        'slot_minutes' => 30,
    ],
    'pe_package' => [
        'laboratory_services' => [
            'CBC',
            'Urinalysis',
            'Fecalysis',
            'Hepatitis',
        ],
        'requires_xray' => true,
        'optional_bulk_services' => [
            'Drug Test',
            'Pregnancy Test',
        ],
    ],
];
