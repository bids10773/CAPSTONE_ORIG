<?php

namespace App\Http\Controllers;

use App\Models\ReportVerification;
use App\Services\ReportVerificationService;
use Illuminate\Http\Response;

class ReportVerificationController extends Controller
{
    public function __invoke(string $token, ReportVerificationService $service): Response
    {
        $record = ReportVerification::where('token', $token)->first();
        $verification = $record ? $service->publicData($record) : null;

        return response()->view('medical-certificates.verify', ['verification' => $verification, 'documentLabel' => $verification['documentLabel'] ?? 'Report'], $verification ? 200 : 404)
            ->withHeaders([
                'Cache-Control' => 'private, no-store, no-cache, must-revalidate, max-age=0',
                'X-Robots-Tag' => 'noindex, nofollow, noarchive, nosnippet', 'Referrer-Policy' => 'no-referrer',
            ]);
    }
}
