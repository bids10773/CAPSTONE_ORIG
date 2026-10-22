<?php

return [
    'vital_limits' => [
        'height' => ['min' => 30, 'max' => 300],
        'weight' => ['min' => 1, 'max' => 500],
        'pulse_rate' => ['min' => 20, 'max' => 250],
        'temperature' => ['min' => 30, 'max' => 45],
        'systolic_pressure' => ['min' => 50, 'max' => 300],
        'diastolic_pressure' => ['min' => 30, 'max' => 200],
        'respiratory_rate' => ['min' => 5, 'max' => 80],
        'oxygen_saturation' => ['min' => 50, 'max' => 100],
    ],
    'required_vital_signs' => array_values(array_filter(array_map('trim', explode(',', (string) env(
        'REQUIRED_VITAL_SIGNS',
        'systolic_pressure,diastolic_pressure,heart_rate,respiratory_rate,temperature,oxygen_saturation,height,weight'
    ))))),
];
