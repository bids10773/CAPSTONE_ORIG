<?php

use App\Models\User;

it('uses a stable PAT reference for patient accounts only', function () {
    $patient = new User(['role' => 'patient']);
    $patient->id = 56;
    $staff = new User(['role' => 'doctor']);
    $staff->id = 57;

    expect($patient->patient_reference_code)
        ->toBe('PAT'.str_pad((string) $patient->id, 4, '0', STR_PAD_LEFT))
        ->and($patient->toArray()['patient_reference_code'])
        ->toBe($patient->patient_reference_code)
        ->and($staff->patient_reference_code)
        ->toBeNull();
});
