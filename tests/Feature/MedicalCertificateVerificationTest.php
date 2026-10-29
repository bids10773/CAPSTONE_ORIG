<?php

use App\Models\MedicalCertificate;
use App\Models\User;
use App\Services\CertificateVerificationService;

function verificationCertificate(string $status = 'issued'): MedicalCertificate
{
    $patient = User::factory()->create(['role' => 'patient']);
    $doctor = User::factory()->licensed()->create(['role' => 'doctor']);

    return MedicalCertificate::create([
        'certificate_number' => 'MC-2026-'.str_pad((string) (MedicalCertificate::count() + 1), 6, '0', STR_PAD_LEFT),
        'sequence_year' => 2026, 'sequence_number' => MedicalCertificate::count() + 1,
        'patient_id' => $patient->id, 'attending_physician_id' => $doctor->id, 'created_by' => $doctor->id,
        'patient_name' => 'Private Person', 'patient_reference_code' => 'PRIVATE-REFERENCE',
        'patient_age' => 35, 'patient_sex' => 'Female', 'patient_civil_status' => 'Single', 'salutation' => 'Ms.',
        'consultation_date' => today(), 'date_issued' => today(), 'physician_name' => 'Example Physician',
        'physician_license_no' => '1234567', 'clinical_impression' => 'PRIVATE-DIAGNOSIS',
        'recommendation' => 'PRIVATE-RECOMMENDATION', 'reason_for_consultation' => 'PRIVATE-REASON',
        'status' => $status, 'issued_at' => $status === 'issued' ? now() : null,
    ]);
}

test('guests can verify issued certificates without seeing private medical information', function () {
    $certificate = verificationCertificate();
    expect($certificate->verification_token)->toBeString()->toHaveLength(64);
    $response = $this->get('/verify/certificate/'.$certificate->verification_token)
        ->assertOk()->assertSee('Issued')->assertSee($certificate->certificate_number)
        ->assertSee('Example Physician')->assertSee('P****** P*****')
        ->assertDontSee('Private Person')->assertDontSee('PRIVATE-DIAGNOSIS')
        ->assertDontSee('PRIVATE-RECOMMENDATION')->assertDontSee('PRIVATE-REASON')
        ->assertDontSee('PRIVATE-REFERENCE')->assertDontSee('1234567')
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
        ->assertHeader('Referrer-Policy', 'no-referrer');
    expect($response->headers->get('Cache-Control'))->toContain('no-store')
        ->and($certificate->toArray())->not->toHaveKey('verification_token');
});

test('verification tokens are stable and void certificates cannot appear issued', function () {
    $certificate = verificationCertificate();
    $token = $certificate->verification_token;
    $certificate->update(['status' => 'void', 'void_reason' => 'PRIVATE-VOID-REASON']);
    expect($certificate->fresh()->verification_token)->toBe($token);
    $this->get('/verify/certificate/'.$token)->assertOk()->assertSee('Voided')
        ->assertDontSee('PRIVATE-VOID-REASON')->assertDontSee('Status: Issued');
});

test('unissued and unknown certificates cannot be publicly verified', function () {
    $draft = verificationCertificate('draft');
    expect($draft->verification_token)->toBeNull();
    $this->get('/verify/certificate/'.str_repeat('a', 64))->assertNotFound();
    $this->get('/verify/certificate/1')->assertNotFound();
    $draft->forceFill(['verification_token' => str_repeat('b', 64)])->save();
    $this->get('/verify/certificate/'.$draft->verification_token)->assertNotFound();
});

test('document verification links use the configured public domain and locally generated QR images', function () {
    config(['medical.certificate_verification_url' => 'https://lmichealth.company']);
    $certificate = verificationCertificate();
    $service = app(CertificateVerificationService::class);
    $data = $service->documentData($certificate);
    expect($data['verificationUrl'])->toBe('https://lmichealth.company/verify/certificate/'.$certificate->verification_token)
        ->and($data['verificationQrDataUri'])->toStartWith('data:image/png;base64,');
    $image = getimagesizefromstring(base64_decode(substr($data['verificationQrDataUri'], strlen('data:image/png;base64,'))));
    expect($image['mime'])->toBe('image/png');
    $this->actingAs($certificate->attendingPhysician)->get(route('medical-certificates.print', $certificate))
        ->assertOk()->assertSee($data['verificationUrl'], false)->assertSee('Scan to verify');
    expect($service->documentData(verificationCertificate('draft')))->toBe([]);
});

test('issuing assigns a unique token while draft and approved saves do not publish one', function () {
    $first = verificationCertificate('draft');
    $first->update(['status' => 'approved']);
    expect($first->verification_token)->toBeNull();
    $first->update(['status' => 'issued', 'issued_at' => now()]);
    $second = verificationCertificate();
    expect($first->verification_token)->toHaveLength(64)
        ->and($first->verification_token)->not->toBe($second->verification_token);
    $token = $first->verification_token;
    $first->update(['updated_by' => $first->attending_physician_id]);
    expect($first->verification_token)->toBe($token);
});

test('public certificate lookups are rate limited', function () {
    $url = '/verify/certificate/'.str_repeat('x', 64);
    for ($attempt = 0; $attempt < 30; $attempt++) {
        $this->get($url)->assertNotFound();
    }
    $this->get($url)->assertStatus(429);
});
