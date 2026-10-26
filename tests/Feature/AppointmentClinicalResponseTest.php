<?php

use App\Models\Appointment;
use App\Models\Company;
use App\Models\User;

test('portal appointment responses contain clinical status only', function (string $role, bool $released) {
    $company = Company::create(['company_name' => 'Synthetic Company', 'status' => 'active']);
    $account = User::factory()->create(['role' => 'company', 'company_id' => $company->id]);
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $medtech = User::factory()->create(['role' => 'medtech']);
    $radtech = User::factory()->create(['role' => 'radtech']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'company_id' => $company->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
        'type' => 'company_referral',
        'status' => $released ? 'completed' : 'accepted',
        'service_types' => ['PE', 'CBC', 'X-Ray'],
    ]);
    $appointment->medicalHistory()->create(['present_illness' => 'SYNTHETIC-PRIVATE-HISTORY']);
    $appointment->physicalExam()->create(['doctor_id' => $doctor->id, 'classification' => 'Class A', 'remarks' => 'SYNTHETIC-PRIVATE-EXAM', 'is_completed' => $released]);
    $appointment->labResult()->create([
        'encoded_by' => $medtech->id,
        'status' => $released ? 'finalized' : 'draft',
        'finalized_at' => $released ? now() : null,
        'cbc_results' => ['hemoglobin' => 'SYNTHETIC-PRIVATE-LAB'],
    ]);
    $appointment->xrayReport()->create([
        'radiologist_id' => $radtech->id,
        'status' => $released ? 'completed' : 'pending',
        'is_completed' => $released,
        'verified_at' => $released ? now() : null,
        'findings' => 'SYNTHETIC-PRIVATE-XRAY',
    ]);
    $appointment->medicalExamination()->firstOrFail()->update([
        'final_diagnosis' => 'SYNTHETIC-PRIVATE-DIAGNOSIS',
        'released_at' => $released ? now() : null,
    ]);

    $response = $this->actingAs($role === 'company' ? $account : $patient)
        ->get(route('appointments.show', $appointment))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('appointments/show')
            ->where('appointment.id', $appointment->id)
            ->where('appointment.medical_history', null)
            ->has('appointment.physical_exam', 1)
            ->where('appointment.physical_exam.is_completed', $released)
            ->has('appointment.lab_result', 2)
            ->where('appointment.lab_result.status', $released ? 'finalized' : 'draft')
            ->has('appointment.xray_report', $role === 'company' ? 4 : 3)
            ->where('appointment.xray_report.status', $released ? 'completed' : 'pending')
            ->has('appointment.medical_examination', 3));

    if ($role === 'company') {
        $response->assertInertia(fn ($page) => $page->where('appointment.xray_report.is_completed', $released));
    }

    foreach (['HISTORY', 'EXAM', 'LAB', 'XRAY', 'DIAGNOSIS'] as $marker) {
        expect($response->getContent())->not->toContain('SYNTHETIC-PRIVATE-'.$marker);
    }

    $otherAccount = User::factory()->create(['role' => 'company', 'company_id' => null]);
    $this->actingAs($otherAccount)->get(route('appointments.show', $appointment))->assertForbidden();

    $this->actingAs($doctor)->get(route('doctor.appointments.show', $appointment))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('appointment.medical_history.present_illness', 'SYNTHETIC-PRIVATE-HISTORY')
            ->where('appointment.lab_result.cbc_results.hemoglobin', 'SYNTHETIC-PRIVATE-LAB'));
})->with([
    'company draft' => ['company', false],
    'company released' => ['company', true],
    'patient draft' => ['patient', false],
    'patient released' => ['patient', true],
]);
