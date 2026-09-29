<?php

use App\Models\Appointment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function staffRecordAppointment(User $patient, array $overrides = []): Appointment
{
    return Appointment::create(array_merge([
        'user_id' => $patient->id,
        'appointment_date' => today(),
        'type' => 'individual',
        'status' => 'accepted',
        'service_types' => ['PE'],
    ], $overrides));
}

test('doctor patient records contain only appointments assigned to that doctor', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $otherDoctor = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);

    $assigned = staffRecordAppointment($patient, ['doctor_id' => $doctor->id]);
    staffRecordAppointment($patient, ['doctor_id' => $otherDoctor->id]);

    $this->actingAs($doctor)
        ->get(route('doctor.patient-records.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('staff/patient-records/index')
            ->where('role', 'doctor')
            ->has('records.data', 1)
            ->where('records.data.0.id', $assigned->id)
            ->where('records.data.0.manage_url', route('doctor.physical-exams.create', $assigned, false)));
});

test('medtech patient records show the laboratory queue but not unrelated completed visits', function () {
    $medtech = User::factory()->create(['role' => 'medtech']);
    $patient = User::factory()->create(['role' => 'patient']);

    $queued = staffRecordAppointment($patient, [
        'status' => 'for_diagnostics',
        'service_types' => ['CBC'],
    ]);
    staffRecordAppointment($patient, [
        'status' => 'completed',
        'service_types' => ['CBC'],
    ]);

    $this->actingAs($medtech)
        ->get(route('medtech.patient-records.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('staff/patient-records/index')
            ->where('role', 'medtech')
            ->has('records.data', 1)
            ->where('records.data.0.id', $queued->id)
            ->where('records.data.0.manage_url', route('medtech.lab-results.create', $queued, false)));
});

test('radtech patient records show the radiology queue but not unrelated completed visits', function () {
    $radtech = User::factory()->create(['role' => 'radtech']);
    $patient = User::factory()->create(['role' => 'patient']);

    $queued = staffRecordAppointment($patient, [
        'status' => 'for_xray',
        'service_types' => ['X-Ray'],
    ]);
    staffRecordAppointment($patient, [
        'status' => 'completed',
        'service_types' => ['X-Ray'],
    ]);

    $this->actingAs($radtech)
        ->get(route('radtech.patient-records.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('staff/patient-records/index')
            ->where('role', 'radtech')
            ->has('records.data', 1)
            ->where('records.data.0.id', $queued->id)
            ->where('records.data.0.manage_url', route('radtech.xrays.create', $queued, false)));
});

test('staff patient records expose only documents allowed for each clinical role', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $medtech = User::factory()->create(['role' => 'medtech']);
    $radtech = User::factory()->create(['role' => 'radtech']);
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = staffRecordAppointment($patient, [
        'doctor_id' => $doctor->id,
        'status' => 'for_diagnostics',
        'service_types' => ['PE', 'CBC', 'X-Ray'],
    ]);
    $appointment->physicalExam()->create([
        'doctor_id' => $doctor->id,
        'classification' => 'Pending',
    ]);
    $appointment->medicalHistory()->create([]);
    $appointment->labResult()->create([
        'encoded_by' => $medtech->id,
        'cbc_results' => ['hemoglobin' => '14'],
        'status' => 'draft',
    ]);
    $appointment->xrayReport()->create([
        'radiologist_id' => $radtech->id,
        'status' => 'awaiting_result',
    ]);

    $this->actingAs($medtech)
        ->get(route('medtech.patient-records.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('records.data.0.documents.physical_exam', false)
            ->where('records.data.0.documents.medical_history', false)
            ->where('records.data.0.documents.final_evaluation', false)
            ->where('records.data.0.documents.laboratory', true)
            ->where('records.data.0.documents.xray', false));

    $this->actingAs($radtech)
        ->get(route('radtech.patient-records.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('records.data.0.documents.physical_exam', false)
            ->where('records.data.0.documents.medical_history', false)
            ->where('records.data.0.documents.final_evaluation', false)
            ->where('records.data.0.documents.laboratory', false)
            ->where('records.data.0.documents.xray', true));

    $this->actingAs($doctor)
        ->get(route('doctor.patient-records.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('records.data.0.documents.physical_exam', true)
            ->where('records.data.0.documents.medical_history', true)
            ->where('records.data.0.documents.laboratory', true)
            ->where('records.data.0.documents.xray', true));
});

test('clinical PDF endpoints enforce document-specific staff access', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $medtech = User::factory()->create(['role' => 'medtech']);
    $radtech = User::factory()->create(['role' => 'radtech']);
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = staffRecordAppointment($patient, [
        'doctor_id' => $doctor->id,
        'status' => 'for_diagnostics',
        'service_types' => ['PE', 'CBC', 'X-Ray'],
    ]);

    $this->actingAs($radtech)
        ->get(route('clinical-forms.physical-exam.pdf', $appointment))
        ->assertForbidden();
    $this->get(route('clinical-forms.pe-section.pdf', [$appointment, 'medical-history']))
        ->assertForbidden();
    $this->get(route('clinical-forms.pe-section.pdf', [$appointment, 'final-evaluation']))
        ->assertForbidden();
    $this->get(route('clinical-forms.laboratory.pdf', $appointment))
        ->assertForbidden();

    $this->actingAs($medtech)
        ->get(route('clinical-forms.physical-exam.pdf', $appointment))
        ->assertForbidden();
    $this->get(route('clinical-forms.xray.pdf', $appointment))
        ->assertForbidden();
});

test('receptionists can review administrative patient records without clinical documents', function () {
    $receptionist = User::factory()->create(['role' => 'receptionist']);
    $doctor = User::factory()->create(['role' => 'doctor']);
    $medtech = User::factory()->create(['role' => 'medtech']);
    $patient = User::factory()->create([
        'role' => 'patient',
        'contact' => '09171234567',
    ]);
    $patient->patientProfile()->create([
        'birthdate' => '1990-01-01',
        'sex' => 'male',
        'civil_status' => 'Single',
        'employee_number' => 'GRE-000123',
    ]);
    $appointment = staffRecordAppointment($patient, [
        'status' => 'completed',
        'service_types' => ['PE', 'CBC'],
    ]);
    $appointment->physicalExam()->create([
        'doctor_id' => $doctor->id,
        'classification' => 'Class A',
    ]);
    $appointment->labResult()->create([
        'encoded_by' => $medtech->id,
        'cbc_results' => ['hemoglobin' => '14'],
        'status' => 'finalized',
    ]);

    $this->actingAs($receptionist)
        ->get(route('receptionist.patient-records.index', ['search' => 'GRE-000123']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('staff/patient-records/index')
            ->where('role', 'receptionist')
            ->has('records.data', 1)
            ->where('records.data.0.id', $appointment->id)
            ->where('records.data.0.patient.contact', '09171234567')
            ->where('records.data.0.patient.employee_number', 'GRE-000123')
            ->where('records.data.0.documents.physical_exam', false)
            ->where('records.data.0.documents.laboratory', false)
            ->where('records.data.0.documents.xray', false)
            ->where('records.data.0.manage_url', null));

    $this->actingAs($receptionist)
        ->get(route('clinical-forms.physical-exam.pdf', $appointment))
        ->assertForbidden();
});
