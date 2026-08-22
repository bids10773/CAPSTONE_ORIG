<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function pendingResultAppointment(array $services, string $status): Appointment
{
    $patient = User::factory()->create(['role' => 'patient']);
    $company = Company::firstOrCreate(['company_name' => 'Pending Results Co'], ['status' => 'active']);

    return Appointment::create([
        'user_id' => $patient->id,
        'company_id' => $company->id,
        'appointment_date' => today(),
        'type' => 'company_referral',
        'status' => $status,
        'service_types' => $services,
    ]);
}

function drugTestPayload(bool $finalize, string $methamphetamine = 'Negative'): array
{
    return [
        'finalize' => $finalize,
        'drug_workflow_action' => 'complete',
        'results' => ['drug_test' => [
            'methamphetamine' => $methamphetamine,
            'tetrahydrocannabinol' => 'Negative',
        ]],
    ];
}

test('medtech can reopen one pending drug test and explicitly finalize it', function () {
    $appointment = pendingResultAppointment(['Drug Test'], 'for_diagnostics');
    $originalMedtech = User::factory()->create(['role' => 'medtech']);
    $continuingMedtech = User::factory()->create(['role' => 'medtech']);

    $this->actingAs($originalMedtech)
        ->post(route('medtech.lab-results.store', $appointment), drugTestPayload(false, 'Pending'))
        ->assertRedirect(route('medtech.appointments'))
        ->assertSessionHas('success', 'Drug Test saved as pending.');

    expect($appointment->labResult()->count())->toBe(1)
        ->and($appointment->labResult->status)->toBe('draft')
        ->and($appointment->medicalExamination->diagnosticResults()->where('service_key', 'drug_test')->first()->status)->toBe('in_progress')
        ->and($appointment->fresh()->status)->toBe('for_diagnostics');

    $this->actingAs($continuingMedtech)->get(route('medtech.appointments'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.data.0.id', $appointment->id)
            ->where('appointments.data.0.lab_result.status', 'draft'));
    $this->get(route('medtech.lab-results.create', $appointment))
        ->assertInertia(fn (Assert $page) => $page
            ->where('labResult.drug_test_results.methamphetamine', 'Pending')
            ->where('locked', false));

    $this->post(route('medtech.lab-results.store', $appointment), drugTestPayload(true))
        ->assertSessionHas('success', 'Drug Test result finalized successfully.');

    $lab = $appointment->labResult()->firstOrFail();
    $drug = $appointment->medicalExamination->diagnosticResults()->where('service_key', 'drug_test')->firstOrFail();
    expect($appointment->labResult()->count())->toBe(1)
        ->and($lab->encoded_by)->toBe($originalMedtech->id)
        ->and($lab->isFinalized())->toBeTrue()
        ->and($drug->encoded_by)->toBe($originalMedtech->id)
        ->and($drug->isVerified())->toBeTrue()
        ->and($appointment->fresh()->status)->toBe('for_final_evaluation');

    $this->get(route('medtech.appointments'))
        ->assertInertia(fn (Assert $page) => $page->has('appointments.data', 0));
});

test('assigned medtech can edit a drug test after it is sent for verification', function () {
    $appointment = pendingResultAppointment(['Drug Test'], 'for_diagnostics');
    $assignedMedtech = User::factory()->create(['role' => 'medtech']);
    $otherMedtech = User::factory()->create(['role' => 'medtech']);

    $verificationPayload = drugTestPayload(true, 'Positive');
    $verificationPayload['drug_workflow_action'] = 'send_verification';
    $this->actingAs($assignedMedtech)
        ->post(route('medtech.lab-results.store', $appointment), $verificationPayload)
        ->assertSessionHas('success');

    expect($appointment->fresh()->status)->toBe('verifying_drug_test');

    $this->get(route('medtech.appointments'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.data.0.id', $appointment->id));
    $this->get(route('medtech.lab-results.create', $appointment))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('drugVerificationPending', true)
            ->where('locked', false));

    $this->actingAs($otherMedtech)
        ->get(route('medtech.lab-results.create', $appointment))
        ->assertForbidden();

    $updated = drugTestPayload(false, 'Positive');
    $updated['drug_workflow_action'] = 'update_verification';
    $updated['remarks'] = 'Official confirmation received and encoded.';
    $this->actingAs($assignedMedtech)
        ->post(route('medtech.lab-results.store', $appointment), $updated)
        ->assertSessionHas('success', 'Drug Test verification result updated successfully.');

    $drug = $appointment->medicalExamination->diagnosticResults()
        ->where('service_key', 'drug_test')->firstOrFail();
    expect($appointment->labResult()->count())->toBe(1)
        ->and($appointment->labResult->fresh()->isFinalized())->toBeTrue()
        ->and($drug->status)->toBe('official_result_received')
        ->and($drug->encoded_by)->toBe($assignedMedtech->id)
        ->and($appointment->fresh()->status)->toBe('verifying_drug_test');

    $final = drugTestPayload(true, 'Positive');
    $final['drug_workflow_action'] = 'complete';
    $this->actingAs($assignedMedtech)
        ->post(route('medtech.lab-results.store', $appointment), $final)
        ->assertSessionHas('success', 'Drug Test result finalized successfully.');

    expect($drug->fresh()->isVerified())->toBeTrue()
        ->and($drug->fresh()->verified_by)->toBe($assignedMedtech->id)
        ->and($drug->fresh()->verified_at)->not->toBeNull()
        ->and($appointment->labResult->fresh()->status)->toBe('finalized')
        ->and($appointment->labResult->fresh()->is_completed)->toBeTrue()
        ->and($appointment->labResult->fresh()->finalized_at)->not->toBeNull()
        ->and($appointment->fresh()->status)->toBe('for_final_evaluation');
});

test('finalized regular laboratory values are not left pending by stale child status', function () {
    $appointment = pendingResultAppointment(['CBC'], 'for_diagnostics');
    $medtech = User::factory()->create(['role' => 'medtech']);
    $examination = app(\App\Services\MedicalExaminationService::class)->forAppointment($appointment);
    $appointment->labResult()->create([
        'medical_examination_id' => $examination->id,
        'encoded_by' => $medtech->id,
        'cbc_results' => ['hemoglobin' => '14.0'],
        'status' => 'finalized',
        'is_completed' => true,
        'finalized_at' => now(),
    ]);
    $examination->diagnosticResults()->where('service_key', 'cbc')->update(['status' => 'pending']);
    $examination->load(['appointment', 'laboratoryResult', 'diagnosticResults']);

    expect(collect($examination->childSummaries())->firstWhere('key', 'cbc')['status'])
        ->toBe('completed');
});

test('radtech can repeatedly save one pending xray then finalize it once', function () {
    $appointment = pendingResultAppointment(['X-Ray'], 'for_xray');
    $originalRadtech = User::factory()->create(['role' => 'radtech']);
    $continuingRadtech = User::factory()->create(['role' => 'radtech']);

    $this->actingAs($originalRadtech)->post(route('radtech.xrays.store', $appointment), [
        'workflow_action' => 'performed',
        'chest_findings' => 'Preliminary image acquired.',
    ])->assertSessionHas('success');

    $this->actingAs($continuingRadtech)->post(route('radtech.xrays.store', $appointment), [
        'workflow_action' => 'performed',
        'chest_findings' => 'Repeat image is technically adequate.',
        'remarks' => 'Awaiting verified impression.',
    ])->assertSessionHas('success');

    expect($appointment->xrayReport()->count())->toBe(1)
        ->and($appointment->xrayReport->fresh()->radiologist_id)->toBe($originalRadtech->id)
        ->and($appointment->xrayReport->fresh()->isVerified())->toBeFalse();

    $this->post(route('radtech.xrays.store', $appointment), [
        'workflow_action' => 'complete',
        'chest_status' => 'normal',
        'chest_findings' => 'Both lungs are clear.',
        'impression' => 'Essentially normal chest X-Ray.',
    ])->assertSessionHas('success', 'X-Ray result finalized successfully.');

    $report = $appointment->xrayReport()->firstOrFail();
    expect($appointment->xrayReport()->count())->toBe(1)
        ->and($report->isVerified())->toBeTrue()
        ->and($report->finalized_by)->toBe($continuingRadtech->id)
        ->and($report->finalized_at)->not->toBeNull()
        ->and($appointment->fresh()->status)->toBe('for_final_evaluation');

    $this->post(route('radtech.xrays.store', $appointment), [
        'workflow_action' => 'complete',
        'chest_status' => 'normal',
        'chest_findings' => 'Changed after finalization.',
        'impression' => 'Changed.',
    ])->assertSessionHasErrors('form');
    expect($report->fresh()->findings)->toBe('Both lungs are clear.');
});

test('clinical result endpoints enforce medtech and radtech role separation', function () {
    $drugAppointment = pendingResultAppointment(['Drug Test'], 'for_diagnostics');
    $xrayAppointment = pendingResultAppointment(['X-Ray'], 'for_xray');
    $medtech = User::factory()->create(['role' => 'medtech']);
    $radtech = User::factory()->create(['role' => 'radtech']);
    $companyUser = User::factory()->create(['role' => 'company']);

    $this->actingAs($medtech)->post(route('radtech.xrays.store', $xrayAppointment), ['workflow_action' => 'performed'])->assertForbidden();
    $this->actingAs($radtech)->post(route('medtech.lab-results.store', $drugAppointment), drugTestPayload(false))->assertForbidden();
    $this->actingAs($drugAppointment->user)->post(route('medtech.lab-results.store', $drugAppointment), drugTestPayload(true))->assertForbidden();
    $this->actingAs($companyUser)->post(route('radtech.xrays.store', $xrayAppointment), ['workflow_action' => 'performed'])->assertForbidden();
});
