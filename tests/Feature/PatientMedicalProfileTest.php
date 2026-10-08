<?php

use App\Models\Appointment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function medicalProfileAppointment(User $patient, bool $released): Appointment
{
    $doctor = User::factory()->create(['role' => 'doctor']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'completed',
        'service_types' => ['PE', 'CBC', 'X-Ray'],
    ]);

    $appointment->physicalExam()->create([
        'doctor_id' => $doctor->id,
        'height' => 170,
        'weight' => 68,
        'blood_pressure' => '120/80',
        'pulse_rate' => 72,
        'respiration_rate' => 16,
        'temperature' => 36.7,
        'visual_acuity' => '20/20',
        'hearing' => 'Normal',
        'classification' => 'Class A',
        'is_completed' => true,
    ]);
    $appointment->medicalExamination()->update([
        'status' => $released ? 'report_released' : 'finalized',
        'medical_classification' => 'Class A',
        'fit_to_work' => true,
        'final_diagnosis' => 'Fit for work',
        'finalized_at' => now(),
        'released_at' => $released ? now() : null,
    ]);

    return $appointment;
}

test('patient profile consolidates released vital signs only', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $olderReleased = medicalProfileAppointment($patient, true);
    $olderReleased->update(['appointment_date' => today()->subDay()]);
    $latestReleased = medicalProfileAppointment($patient, true);
    medicalProfileAppointment($patient, false);

    $this->actingAs($patient)
        ->get(route('profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/profile')
            ->has('medicalRecords', 1)
            ->where('medicalRecords.0.id', $latestReleased->id)
            ->where('medicalRecords.0.examination_date', today()->toDateString())
            ->where('medicalRecords.0.vital_signs.blood_pressure', '120/80')
            ->where('medicalRecords.0.vital_signs.bmi', 23.5)
            ->missing('medicalRecords.0.reference_code')
            ->missing('medicalRecords.0.appointment_date')
            ->missing('medicalRecords.0.service_types')
            ->missing('medicalRecords.0.documents')
            ->missing('medicalRecords.0.medical_history')
            ->missing('medicalRecords.0.laboratory_results')
            ->missing('medicalRecords.0.xray_result')
            ->missing('medicalRecords.0.final_evaluation'));
});

test('admin can open a patient longitudinal medical profile including unreleased records', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    $unreleased = medicalProfileAppointment($patient, false);
    $medtech = User::factory()->create(['role' => 'medtech']);
    $radtech = User::factory()->create(['role' => 'radtech']);
    $unreleased->labResult()->create([
        'encoded_by' => $medtech->id,
        'cbc_results' => ['hemoglobin' => '14.5'],
        'status' => 'finalized',
        'finalized_at' => now(),
    ]);
    $unreleased->xrayReport()->create([
        'radiologist_id' => $radtech->id,
        'findings' => 'Clear lungs',
        'impression' => 'Normal chest study',
        'status' => 'completed',
        'is_completed' => true,
        'verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.patients.show', $patient))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/patients/show')
            ->where('patient.id', $patient->id)
            ->has('medicalRecords', 1)
            ->where('medicalRecords.0.id', $unreleased->id)
            ->where('medicalRecords.0.vital_signs.temperature_c', '36.70')
            ->has('medicalReports', 1)
            ->where('medicalReports.0.id', $unreleased->id)
            ->has('medicalReports.0.assigned_staff', 3)
            ->where('medicalReports.0.assigned_staff.0.id', $unreleased->doctor_id)
            ->where('medicalReports.0.assigned_staff.1.id', $medtech->id)
            ->where('medicalReports.0.assigned_staff.2.id', $radtech->id)
            ->where('medicalReports.0.reports.laboratory.sections.0', 'Complete Blood Count')
            ->where('medicalReports.0.reports.xray.impression', 'Normal chest study')
            ->where('medicalReports.0.reports.physical_exam.classification', 'Class A'));
});

test('admin medical reports include visits without a physical exam', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient']);
    $medtech = User::factory()->create(['role' => 'medtech']);
    $appointment = Appointment::create([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'completed',
        'service_types' => ['CBC'],
    ]);
    $appointment->labResult()->create([
        'encoded_by' => $medtech->id,
        'cbc_results' => ['hemoglobin' => '14.5'],
        'status' => 'finalized',
        'finalized_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.patients.show', $patient))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('medicalRecords', 0)
            ->has('medicalReports', 1)
            ->where('medicalReports.0.id', $appointment->id)
            ->where('medicalReports.0.assigned_staff.0.id', $medtech->id)
            ->where('medicalReports.0.reports.laboratory.status', 'finalized'));
});

test('non administrators cannot open another patient admin medical profile', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $otherPatient = User::factory()->create(['role' => 'patient']);

    $this->actingAs($patient)
        ->get(route('admin.patients.show', $otherPatient))
        ->assertForbidden();
});
