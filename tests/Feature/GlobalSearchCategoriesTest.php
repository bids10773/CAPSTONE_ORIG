<?php

use App\Models\Appointment;
use App\Models\MedicalCertificate;
use App\Models\MedicalDocument;
use App\Models\User;

function searchCertificate(User $patient, User $doctor, int $sequence): MedicalCertificate
{
    return MedicalCertificate::withoutEvents(fn () => MedicalCertificate::create([
        'certificate_number' => 'MC-Search-'.$sequence, 'sequence_year' => 2026, 'sequence_number' => $sequence,
        'patient_id' => $patient->id, 'attending_physician_id' => $doctor->id,
        'salutation' => 'Ms.', 'patient_name' => $patient->name, 'physician_name' => $doctor->name,
        'consultation_date' => today(), 'status' => 'draft', 'clinical_impression' => 'PRIVATE DIAGNOSIS',
    ]));
}

function searchDocument(User $patient, string $type, int $sequence, ?Appointment $appointment = null): MedicalDocument
{
    return MedicalDocument::create([
        'document_number' => 'DOC-Search-'.$sequence, 'source_key' => 'search:'.$sequence,
        'source_type' => 'test', 'source_id' => $sequence, 'patient_id' => $patient->id,
        'appointment_id' => $appointment?->id, 'document_type' => $type,
        'title' => 'Search document', 'status' => 'approved',
    ]);
}

test('patients and staff are separate search categories', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $patient = User::factory()->create(['role' => 'patient', 'first_name' => 'SharedSearch']);
    $staff = User::factory()->create(['role' => 'medtech', 'first_name' => 'SharedSearch']);

    $this->actingAs($admin)->getJson(route('api.global-search', ['q' => 'SharedSearch', 'category' => 'patients']))
        ->assertOk()->assertJsonPath('groups.0.title', 'Patients')
        ->assertJsonFragment(['id' => 'person-'.$patient->id])->assertJsonMissing(['id' => 'staff-'.$staff->id]);
    $this->getJson(route('api.global-search', ['q' => 'SharedSearch', 'category' => 'staff']))
        ->assertOk()->assertJsonPath('groups.0.title', 'Staff')
        ->assertJsonFragment(['id' => 'staff-'.$staff->id])->assertJsonMissing(['id' => 'person-'.$patient->id])
        ->assertJsonFragment(['subtitle' => 'Medical Technologist · '.$staff->email]);
});

test('certificate search restricts physicians to certificates they attend', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $otherDoctor = User::factory()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $own = searchCertificate($patient, $doctor, 1);
    $private = searchCertificate($patient, $otherDoctor, 2);

    $this->actingAs($doctor)->getJson(route('api.global-search', ['q' => 'MC-Search', 'category' => 'certificates']))
        ->assertOk()->assertJsonFragment(['id' => 'certificate-'.$own->id, 'url' => route('medical-certificates.show', $own)])
        ->assertJsonMissing(['id' => 'certificate-'.$private->id])->assertDontSee('PRIVATE DIAGNOSIS');
});

test('patient document search only exposes their own visible documents', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $other = User::factory()->create(['role' => 'patient']);
    $own = searchDocument($patient, 'laboratory_report', 1);
    $private = searchDocument($other, 'laboratory_report', 2);

    $this->actingAs($patient)->getJson(route('api.global-search', ['q' => 'DOC-Search', 'category' => 'documents']))
        ->assertOk()->assertJsonFragment(['id' => 'document-'.$own->id, 'url' => route('medical-documents.patient')])
        ->assertJsonMissing(['id' => 'document-'.$private->id]);
});

test('diagnostic document searches respect service type and onsite assignment', function (string $role, string $type) {
    $staff = User::factory()->create(['role' => $role]);
    $patient = User::factory()->create(['role' => 'patient']);
    $visit = Appointment::create(['user_id' => $patient->id, 'type' => 'individual', 'status' => 'completed', 'appointment_date' => today()]);
    $lab = searchDocument($patient, 'laboratory_report', 1, $visit);
    $xray = searchDocument($patient, 'xray_report', 2, $visit);
    $bulk = Appointment::create(['user_id' => $patient->id, 'type' => 'company_bulk', 'status' => 'accepted', 'appointment_date' => today()]);
    $child = Appointment::create(['user_id' => $patient->id, 'bulk_appointment_id' => $bulk->id, 'type' => 'individual', 'status' => 'completed', 'appointment_date' => today()]);
    $private = searchDocument($patient, $type, 3, $child);
    $own = $type === 'laboratory_report' ? $lab : $xray;
    $other = $type === 'laboratory_report' ? $xray : $lab;

    $this->actingAs($staff)->getJson(route('api.global-search', ['q' => 'DOC-Search', 'category' => 'documents']))
        ->assertOk()->assertJsonFragment(['id' => 'document-'.$own->id])
        ->assertJsonMissing(['id' => 'document-'.$other->id])->assertJsonMissing(['id' => 'document-'.$private->id]);
})->with([['medtech', 'laboratory_report'], ['radtech', 'xray_report']]);

test('restricted categories cannot be requested directly', function (string $role, string $category) {
    $user = User::factory()->create(['role' => $role]);
    $this->actingAs($user)->getJson(route('api.global-search', ['q' => 'Search', 'category' => $category]))->assertForbidden();
})->with([
    ['doctor', 'staff'], ['receptionist', 'staff'], ['patient', 'staff'],
    ['medtech', 'certificates'], ['radtech', 'certificates'], ['patient', 'certificates'],
    ['company', 'documents'], ['company', 'certificates'], ['company', 'staff'],
]);
