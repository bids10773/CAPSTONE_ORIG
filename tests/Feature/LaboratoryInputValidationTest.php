<?php

use App\Models\Appointment;
use App\Models\User;
use App\Services\LaboratoryFormDefinition;

function laboratoryValidationFixture(array $services = ['CBC']): array
{
    $patient = User::factory()->create(['role' => 'patient', 'sex' => 'female']);
    $medtech = User::factory()->create(['role' => 'medtech']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'for_diagnostics',
        'service_types' => $services,
    ]);

    return [$appointment, $medtech];
}

test('every numeric laboratory field has explicit sanity and reference metadata', function () {
    $numericFields = collect(app(LaboratoryFormDefinition::class)->sections())
        ->flatMap(fn (array $section) => $section['fields'])
        ->where('type', 'number');

    expect($numericFields)->not->toBeEmpty();
    $numericFields->each(function (array $field): void {
        expect($field['validation'])->toHaveKeys(['min', 'max', 'decimals'])
            ->and($field['reference'])->not->toBeEmpty();
    });
});

test('malformed and impossible numeric laboratory values are rejected in drafts', function (string $field, string $value) {
    [$appointment, $medtech] = laboratoryValidationFixture();

    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), [
        'finalize' => false,
        'results' => ['cbc' => [$field => $value]],
    ])->assertSessionHasErrors("results.cbc.{$field}");

    $this->assertDatabaseMissing('lab_results', ['appointment_id' => $appointment->id]);
})->with([
    'negative value' => ['hemoglobin', '-1'],
    'letters' => ['hemoglobin', 'abc'],
    'mixed copy-paste' => ['hemoglobin', '12abc'],
    'scientific notation' => ['hemoglobin', '1e2'],
    'too many decimals' => ['hemoglobin', '12.345'],
    'duplicate decimal points' => ['hemoglobin', '12..3'],
    'above sanity maximum' => ['hemoglobin', '30.01'],
    'hematocrit above sanity maximum' => ['hematocrit', '1.001'],
]);

test('submitted select values must belong to the defined laboratory options', function () {
    [$appointment, $medtech] = laboratoryValidationFixture(['Urinalysis']);

    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), [
        'finalize' => false,
        'results' => ['urinalysis' => ['color' => 'Injected option']],
    ])->assertSessionHasErrors('results.urinalysis.color');
});

test('abnormal but plausible results remain recordable and whitespace is trimmed', function () {
    [$appointment, $medtech] = laboratoryValidationFixture();

    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), [
        'finalize' => false,
        'results' => ['cbc' => ['hemoglobin' => ' 25.5 ']],
    ])->assertSessionHasNoErrors();

    expect($appointment->labResult()->first()->cbc_results['hemoglobin'])->toBe('25.5');
});

test('blank draft fields remain allowed while finalization still requires results', function () {
    [$appointment, $medtech] = laboratoryValidationFixture();

    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), [
        'finalize' => false,
        'results' => ['cbc' => ['hemoglobin' => '']],
    ])->assertSessionHasNoErrors();

    $this->actingAs($medtech)->post(route('medtech.lab-results.store', $appointment), [
        'finalize' => true,
        'results' => ['cbc' => ['hemoglobin' => '14']],
    ])->assertSessionHasErrors('results.cbc.hematocrit');
});
