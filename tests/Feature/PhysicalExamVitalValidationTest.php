<?php

use App\Models\Appointment;
use App\Models\User;

function vitalExamAppointment(): array
{
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'for_physical_examination',
        'service_types' => ['PE'],
    ]);

    return [$appointment, $doctor];
}

function validVitalExamPayload(): array
{
    $payload = [
        'height' => '165.5',
        'weight' => '55.5',
        'systolic_pressure' => '120',
        'diastolic_pressure' => '80',
        'pulse_rate' => '72',
        'respiration_rate' => '16',
        'temperature' => '36.5',
        'visual_acuity' => '20/20 OU',
        'hearing' => 'Normal bilateral',
    ];

    foreach (['head_scalp', 'eyes', 'ears', 'nose_sinuses', 'mouth_throat', 'neck_thyroid', 'chest_breast', 'lungs', 'heart', 'abdomen', 'back', 'anus', 'genitals', 'extremities', 'skin', 'dental'] as $part) {
        $payload["{$part}_status"] = 'normal';
        $payload[$part] = null;
    }

    return $payload;
}

test('valid boundary and decimal vital signs are stored consistently', function (array $values, string $storedBloodPressure) {
    [$appointment, $doctor] = vitalExamAppointment();

    $this->actingAs($doctor)
        ->post(route('doctor.physical-exams.store', $appointment), [...validVitalExamPayload(), ...$values])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('physical_exams', [
        'appointment_id' => $appointment->id,
        'blood_pressure' => $storedBloodPressure,
    ]);
})->with([
    'minimum boundaries' => [[
        'height' => '30', 'weight' => '1', 'pulse_rate' => '20', 'temperature' => '30.0',
        'systolic_pressure' => '50', 'diastolic_pressure' => '30',
    ], '50/30'],
    'maximum boundaries' => [[
        'height' => '300', 'weight' => '500', 'pulse_rate' => '250', 'temperature' => '45.0',
        'systolic_pressure' => '300', 'diastolic_pressure' => '200',
    ], '300/200'],
    'trimmed values' => [[
        'height' => ' 165.5 ', 'weight' => ' 55.5 ', 'pulse_rate' => ' 72 ', 'temperature' => ' 36.5 ',
        'systolic_pressure' => ' 120 ', 'diastolic_pressure' => ' 80 ',
    ], '120/80'],
]);

test('invalid vital sign input is rejected', function (string $field, mixed $value, string $errorField) {
    [$appointment, $doctor] = vitalExamAppointment();

    $this->actingAs($doctor)
        ->post(route('doctor.physical-exams.store', $appointment), [
            ...validVitalExamPayload(),
            $field => $value,
        ])
        ->assertSessionHasErrors($errorField);

    $this->assertDatabaseMissing('physical_exams', ['appointment_id' => $appointment->id]);
})->with([
    'blank height' => ['height', '', 'height'],
    'zero height' => ['height', '0', 'height'],
    'negative height' => ['height', '-165', 'height'],
    'height below minimum' => ['height', '29.9', 'height'],
    'height above maximum' => ['height', '300.1', 'height'],
    'height with excess decimals' => ['height', '165.55', 'height'],
    'height letters' => ['height', 'abc', 'height'],
    'height symbols' => ['height', '12--5', 'height'],
    'height scientific notation' => ['height', '1e2', 'height'],
    'very long weight' => ['weight', '999999999999999999', 'weight'],
    'negative weight' => ['weight', '-55', 'weight'],
    'weight above maximum' => ['weight', '500.1', 'weight'],
    'weight with excess decimals' => ['weight', '55.55', 'weight'],
    'decimal pulse' => ['pulse_rate', '72.5', 'pulse_rate'],
    'negative pulse' => ['pulse_rate', '-60', 'pulse_rate'],
    'pulse above maximum' => ['pulse_rate', '251', 'pulse_rate'],
    'pulse letters' => ['pulse_rate', 'abc', 'pulse_rate'],
    'negative temperature' => ['temperature', '-36', 'temperature'],
    'temperature above maximum' => ['temperature', '45.1', 'temperature'],
    'temperature with excess decimals' => ['temperature', '36.55', 'temperature'],
    'temperature letters' => ['temperature', 'abc', 'temperature'],
    'missing systolic' => ['systolic_pressure', '', 'systolic_pressure'],
    'missing diastolic' => ['diastolic_pressure', '', 'diastolic_pressure'],
    'decimal systolic' => ['systolic_pressure', '120.5', 'systolic_pressure'],
    'negative systolic' => ['systolic_pressure', '-120', 'systolic_pressure'],
    'systolic below range' => ['systolic_pressure', '49', 'systolic_pressure'],
    'diastolic above range' => ['diastolic_pressure', '201', 'diastolic_pressure'],
    'systolic lower than diastolic' => ['systolic_pressure', '70', 'systolic_pressure'],
    'systolic equal to diastolic' => ['systolic_pressure', '80', 'systolic_pressure'],
]);

test('legacy combined blood pressure remains accepted and normalized', function () {
    [$appointment, $doctor] = vitalExamAppointment();
    $payload = validVitalExamPayload();
    unset($payload['systolic_pressure'], $payload['diastolic_pressure']);
    $payload['blood_pressure'] = ' 120 / 80 ';

    $this->actingAs($doctor)
        ->post(route('doctor.physical-exams.store', $appointment), $payload)
        ->assertSessionHasNoErrors();

    expect($appointment->physicalExam()->value('blood_pressure'))->toBe('120/80');
});

test('editing an existing exam keeps one record and updates valid vital signs', function () {
    [$appointment, $doctor] = vitalExamAppointment();

    $this->actingAs($doctor)->post(route('doctor.physical-exams.store', $appointment), validVitalExamPayload());
    $this->actingAs($doctor)->post(route('doctor.physical-exams.store', $appointment), [
        ...validVitalExamPayload(),
        'weight' => '56.5',
        'systolic_pressure' => '110',
        'diastolic_pressure' => '70',
    ])->assertSessionHasNoErrors();

    expect($appointment->physicalExam()->count())->toBe(1)
        ->and($appointment->physicalExam()->value('weight'))->toBe('56.50')
        ->and($appointment->physicalExam()->value('blood_pressure'))->toBe('110/70');
});
