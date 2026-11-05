<?php

use App\Models\Appointment;
use App\Models\User;
use App\Notifications\MedicalReportReleased;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

test('patients collect completed results at the clinic instead of downloading clinical PDFs', function (string $document) {
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->licensed()->create(['role' => 'doctor']);
    $appointment = Appointment::create([
        'user_id' => $patient->id, 'doctor_id' => $doctor->id,
        'appointment_date' => today(), 'type' => 'individual', 'status' => 'completed',
        'examination_purpose' => 'pre_employment', 'service_types' => ['PE', 'CBC', 'X-Ray'],
    ]);
    $appointment->physicalExam()->create(['doctor_id' => $doctor->id, 'classification' => 'Class A', 'is_completed' => true]);
    $appointment->labResult()->create(['encoded_by' => $doctor->id, 'status' => 'finalized', 'is_completed' => true, 'finalized_at' => now(), 'cbc_results' => ['hemoglobin' => 14]]);
    $appointment->xrayReport()->create(['radiologist_id' => $doctor->id, 'status' => 'completed', 'is_completed' => true, 'verified_at' => now()]);
    $appointment->medicalExamination()->update(['finalized_at' => now(), 'released_at' => now(), 'released_by' => $doctor->id]);

    $parameters = $document === 'laboratory.section' ? [$appointment, 'cbc'] : $appointment;
    $this->actingAs($patient)->get(route('clinical-forms.'.$document.'.pdf', $parameters))->assertForbidden();
})->with(['physical-exam', 'laboratory', 'laboratory.section', 'xray']);

test('report handoff notifications direct patients to clinic collection tracking without digital delivery', function () {
    $patient = User::factory()->create(['role' => 'patient']);
    $notification = new MedicalReportReleased;
    $mail = $notification->toMail($patient);

    expect(strtolower(implode(' ', $mail->introLines)))
        ->toContain('clinic')
        ->not->toContain('patient portal');
    expect($mail->attachments)->toBeEmpty();
    expect($mail->actionUrl)->toBe(route('medical-documents.patient'));
    expect($notification->toDatabase($patient)['message'])->toContain('clinic');
});

test('forwarding a finalized report redirects the doctor to the queue', function () {
    Notification::fake();
    $doctor = User::factory()->licensed()->create(['role' => 'doctor']);
    $patient = User::factory()->create(['role' => 'patient']);
    $appointment = Appointment::create([
        'user_id' => $patient->id, 'doctor_id' => $doctor->id,
        'appointment_date' => today(), 'type' => 'individual', 'status' => 'completed',
        'examination_purpose' => 'pre_employment', 'service_types' => ['PE'],
    ]);
    $appointment->medicalExamination()->update(['finalized_at' => now(), 'finalized_by' => $doctor->id]);

    $this->actingAs($doctor)->from('/doctor/final-evaluation/'.$appointment->id)
        ->post(route('doctor.medical-reports.release', $appointment))
        ->assertRedirect(route('doctor.appointments'))
        ->assertSessionHas('success');
    expect($appointment->fresh()->medicalExamination->released_at)->not->toBeNull();
});

test('report handoff notifications are queued instead of delaying the redirect', function () {
    Queue::fake();
    Mail::fake();
    $patient = User::factory()->create(['role' => 'patient']);

    $patient->notify(new MedicalReportReleased);

    Queue::assertPushed(SendQueuedNotifications::class, fn ($job) => $job->notification instanceof MedicalReportReleased);
    Mail::assertNothingSent();
});
