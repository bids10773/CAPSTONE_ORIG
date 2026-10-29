<?php

namespace App\Services;

use App\Models\MedicalCertificate;
use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Renderer\GDLibRenderer;
use BaconQrCode\Writer;

class CertificateVerificationService
{
    public function documentData(MedicalCertificate $certificate): array
    {
        if ($certificate->status !== 'issued' || blank($certificate->verification_token)) {
            return [];
        }

        return $this->linkData('certificates.verify', $certificate->verification_token);
    }

    public function linkData(string $route, string $token): array
    {
        $url = rtrim(config('medical.certificate_verification_url'), '/')
            .route($route, ['token' => $token], false);
        $png = (new Writer(new GDLibRenderer(360, 4)))->writeString($url, 'UTF-8', ErrorCorrectionLevel::M());

        return [
            'verificationUrl' => $url,
            'verificationQrDataUri' => 'data:image/png;base64,'.base64_encode($png),
        ];
    }
}
