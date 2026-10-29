<?php

namespace App\Http\Controllers;

use App\Models\MedicalCertificate;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class CertificateVerificationController extends Controller
{
    public function __invoke(string $token): Response
    {
        $certificate = MedicalCertificate::query()->where('verification_token', $token)
            ->whereIn('status', ['issued', 'void'])
            ->first(['certificate_number', 'patient_name', 'physician_name', 'date_issued', 'status']);
        $data = $certificate ? [
            'number' => $certificate->certificate_number,
            'patient' => collect(preg_split('/\s+/u', trim($certificate->patient_name)) ?: [])
                ->filter()->map(fn (string $part) => Str::substr($part, 0, 1).str_repeat('*', max(1, Str::length($part) - 1)))->implode(' '),
            'physician' => $certificate->physician_name,
            'issuedDate' => $certificate->date_issued?->format('F j, Y'),
            'status' => $certificate->status === 'issued' ? 'Issued' : 'Voided',
        ] : null;

        return response()->view('medical-certificates.verify', ['verification' => $data], $certificate ? 200 : 404)
            ->withHeaders([
                'Cache-Control' => 'private, no-store, no-cache, must-revalidate, max-age=0',
                'X-Robots-Tag' => 'noindex, nofollow, noarchive, nosnippet',
                'Referrer-Policy' => 'no-referrer',
            ]);
    }
}
