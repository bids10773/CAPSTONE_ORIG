<?php

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Str;

function vitalExamAppointment(): array
{
    $patient = User::factory()->create(['role' => 'patient']);
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $appointment = Appointment::create([
        'user_id' => $patient->id, 'appointment_date' => today(), 'type' => 'individual',
        'status' => 'arrived', 'arrived_at' => now(), 'service_types' => ['PE'],
    ]);

    return [$appointment, $receptionist];
}

function validVitalExamPayload(): array
{
    return ['submission_key' => (string) Str::uuid(), 'measurement_type' => 'initial',
        'height' => '165.5', 'weight' => '55.5', 'systolic_pressure' => '120',
        'diastolic_pressure' => '80', 'heart_rate' => '72', 'respiratory_rate' => '16',
        'temperature' => '36.5', 'oxygen_saturation' => '98'];
}

test('valid boundary and decimal vital signs are stored consistently', function (array $values, string $storedBmi) {
    [$appointment, $receptionist] = vitalExamAppointment();
    $this->actingAs($receptionist)->post(route('receptionist.vital-signs.store', $appointment), [
        ...validVitalExamPayload(), ...$values,
    ])->assertSessionHasNoErrors();
    $this->assertDatabaseHas('vital_signs', ['appointment_id' => $appointment->id, 'bmi' => $storedBmi]);
})->with([
    'minimum valid dimensions' => [['height' => '30', 'weight' => '1'], '11.1'],
    'maximum valid dimensions' => [['height' => '300', 'weight' => '500'], '55.6'],
    'typical decimals' => [['height' => '165.5', 'weight' => '55.5'], '20.3'],
]);

test('invalid receptionist vital sign input is rejected', function (string $field, mixed $value, string $errorField) {
    [$appointment, $receptionist] = vitalExamAppointment();
    $this->actingAs($receptionist)->post(route('receptionist.vital-signs.store', $appointment), [
        ...validVitalExamPayload(), $field => $value,
    ])->assertSessionHasErrors($errorField);
    $this->assertDatabaseMissing('vital_signs', ['appointment_id' => $appointment->id]);
})->with([
    'blank height' => ['height', '', 'height'],
    'zero height' => ['height', '0', 'height'],
    'height above maximum' => ['height', '301', 'height'],
    'negative weight' => ['weight', '-55', 'weight'],
    'heart rate above maximum' => ['heart_rate', '251', 'heart_rate'],
    'temperature above maximum' => ['temperature', '45.1', 'temperature'],
    'missing systolic' => ['systolic_pressure', '', 'systolic_pressure'],
    'diastolic above range' => ['diastolic_pressure', '201', 'diastolic_pressure'],
    'systolic lower than diastolic' => ['systolic_pressure', '70', 'systolic_pressure'],
    'respiratory rate too low' => ['respiratory_rate', '4', 'respiratory_rate'],
    'oxygen saturation above 100' => ['oxygen_saturation', '101', 'oxygen_saturation'],
]);

test('re-measurement keeps both historical records', function () {
    [$appointment, $receptionist] = vitalExamAppointment();
    $this->actingAs($receptionist)->post(route('receptionist.vital-signs.store', $appointment), validVitalExamPayload());
    $first = $appointment->vitalSigns()->firstOrFail();
    $this->post(route('receptionist.vital-signs.store', $appointment), [
        ...validVitalExamPayload(), 'measurement_type' => 'recheck', 'supersedes_id' => $first->id,
        'systolic_pressure' => 110, 'diastolic_pressure' => 70,
    ])->assertSessionHasNoErrors();
    expect($appointment->vitalSigns()->count())->toBe(2)
        ->and($first->fresh()->systolic_pressure)->toBe(120);
});
