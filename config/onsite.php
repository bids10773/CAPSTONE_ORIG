<?php

return [
    /* Employees handled by one staff member during a standard onsite day. */
    'staffing_ratios' => [
        'doctor' => (int) env('ONSITE_EMPLOYEES_PER_DOCTOR', 50),
        'medtech' => (int) env('ONSITE_EMPLOYEES_PER_MEDTECH', 75),
        'radtech' => (int) env('ONSITE_EMPLOYEES_PER_RADTECH', 75),
        'receptionist' => (int) env('ONSITE_EMPLOYEES_PER_RECEPTIONIST', 150),
    ],
    'default_queue_capacity' => (int) env('ONSITE_QUEUE_CAPACITY', 10),
];
