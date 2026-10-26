<?php

return [
    'proxies' => array_values(array_filter(array_map('trim', explode(',', (string) env('TRUSTED_PROXIES', ''))))),
    'hosts' => array_values(array_filter(array_map('trim', explode(',', (string) env('TRUSTED_HOSTS', ''))))),
    'railway' => [
        'enabled' => env('TRUST_RAILWAY_PROXY', false),
        'environment_id' => env('RAILWAY_ENVIRONMENT_ID'),
        'tcp_application_port' => env('RAILWAY_TCP_APPLICATION_PORT'),
    ],
];
