@php
    $documentMode = $documentMode ?? 'pdf';
    $status = strtolower((string) $certificate->status);
    $issued = $status === 'issued';
    $logoFile = public_path('images/full_logo2-optimized.png');
    $logoData = is_file($logoFile)
        ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoFile))
        : null;

    $asDate = static function ($value): ?\Carbon\CarbonInterface {
        if (blank($value)) {
            return null;
        }

        return $value instanceof \Carbon\CarbonInterface
            ? $value
            : \Illuminate\Support\Carbon::parse($value);
    };

    $issuedDate = $asDate($certificate->date_issued);
    $consultationDate = $asDate($certificate->consultation_date);
    $restStart = $asDate($certificate->rest_start_date);
    $restEnd = $asDate($certificate->rest_end_date);
    $salutation = filled($certificate->salutation) ? $certificate->salutation : 'Mr./Ms.';
    $display = static fn ($value, string $fallback = ''): string => filled($value) ? (string) $value : $fallback;
@endphp

<style>
    @include('pdf.partials.clinic-styles')
    @page {
        size: A4 portrait;
        margin: 24px 28px;
    }

    * {
        box-sizing: border-box;
    }

    body {
        margin: 0;
        padding: 0;
    }

    body {
        color: #111;
        font-family: DejaVu Sans, Arial, sans-serif;
        font-size: 10.5pt;
        line-height: 1.25;
    }

    .medical-certificate-sheet {
        position: relative;
        width: 100%;
        min-height: 272mm;
        background: #fff;
    }

    .medical-certificate-title {
        margin-top: 4.5mm;
        font-size: 16px;
        font-weight: 700;
        text-align: center;
        color: #009b4d;
    }

    .medical-certificate-date-row {
        margin-top: 2.5mm;
        text-align: right;
    }

    .medical-certificate-reference-row {
        margin-top: 1.5mm;
        color: #333;
        font-size: 8.5pt;
        text-align: center;
    }

    .medical-certificate-reference-row span + span {
        margin-left: 5mm;
    }

    .medical-certificate-inline-line {
        display: inline-block;
        min-height: 5.8mm;
        border-bottom: 1px solid #111;
        padding: 0 .8mm .2mm;
        text-align: center;
        vertical-align: baseline;
    }

    .medical-certificate-date-line {
        width: 37mm;
    }

    .medical-certificate-greeting {
        margin: 10mm 0 6mm;
    }

    .medical-certificate-certification {
        margin: 0;
        line-height: 1.5;
    }

    .medical-certificate-name-line {
        width: 64mm;
        text-align: left;
    }

    .medical-certificate-age-line {
        width: 12mm;
    }

    .medical-certificate-sex-line {
        width: 18mm;
    }

    .medical-certificate-status-line {
        width: 28mm;
    }

    .medical-certificate-section-label {
        margin-top: 4mm;
        font-weight: 400;
        color: #009b4d;
        text-transform: uppercase;
    }

    .medical-certificate-ruled-block {
        border-bottom: 1px solid #00a651;
        padding: 1mm 1mm 2mm;
    }

    .medical-certificate-ruled-block--three {
        min-height: 18mm;
    }

    .medical-certificate-ruled-block--two {
        min-height: 12mm;
    }

    .medical-certificate-ruled-value {
        line-height: 1.35;
        overflow-wrap: break-word;
        white-space: pre-line;
        word-wrap: break-word;
    }

    .medical-certificate-rest {
        margin-top: 4mm;
    }

    .medical-certificate-rest-line {
        width: 42mm;
    }

    .medical-certificate-issued-copy {
        max-width: 150mm;
        margin-top: 4mm;
        line-height: 1.5;
    }

    .medical-certificate-day-line {
        width: 32mm;
    }

    .medical-certificate-month-line {
        width: 42mm;
    }

    .medical-certificate-signature {
        width: 76mm;
        margin: 5mm 0 0 auto;
        page-break-inside: avoid;
        text-align: left;
    }

    .medical-certificate-verification {
        margin-top: 3mm;
        font-size: 8pt;
        line-height: 1.2;
        page-break-inside: avoid;
    }

    .medical-certificate-verification img {
        width: 28mm;
        height: 28mm;
        display: block;
    }

    .medical-certificate-verification a {
        display: block;
        margin-top: 1mm;
        color: #285c3b;
    }

    .medical-certificate-signature-mark {
        position: relative;
        height: 14mm;
    }

    .medical-certificate-signature-name {
        overflow: hidden;
        margin-top: 1mm;
        font-size: 8.5pt;
        font-weight: 700;
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-bottom: 1mm;
        border-bottom: 1.1px solid #111;
    }

    .medical-certificate-signature-image-container {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 1mm;
        text-align: center;
    }

    .medical-certificate-signature-image {
        max-width: 55mm;
        max-height: 12mm;
    }

    .medical-certificate-signature-role,
    .medical-certificate-license {
        font-size: 8pt;
        font-weight: 600;
        line-height: 1.35;
        text-align: center;
    }

    .medical-certificate-license-value {
        display: inline-block;
        min-width: 36mm;
        border-bottom: 1px solid #111;
        padding: 0 1mm;
        font-weight: 400;
    }

    .medical-certificate-note {
        margin-top: 5mm;
        font-size: 10.5pt;
        font-style: italic;
        font-weight: 700;
    }

    .medical-certificate-watermark {
        position: absolute;
        z-index: 10;
        top: 48%;
        left: 8%;
        width: 84%;
        color: rgba(145, 30, 30, .16);
        font-size: 36pt;
        font-weight: 700;
        letter-spacing: 2px;
        text-align: center;
        text-transform: uppercase;
        transform: rotate(-28deg);
    }

    @if($documentMode === 'print')
        @media screen {
            body {
                background: #e5e7eb;
            }

            .medical-certificate-sheet {
                width: 210mm;
                min-height: 297mm;
                margin: 8mm auto;
                padding: 24px 28px;
                box-shadow: 0 5px 24px rgba(15, 23, 42, .16);
            }
        }

        @media print {
            body {
                background: #fff;
            }

            .medical-certificate-sheet {
                width: auto;
                min-height: 272mm;
                margin: 0;
                padding: 0;
                box-shadow: none;
            }
        }
    @endif
</style>

<article class="medical-certificate-sheet" aria-label="Medical Certificate">
    @if(! $issued)
        <div class="medical-certificate-watermark">
            {{ $status === 'void' ? 'VOID' : 'DRAFT - NOT VALID' }}
        </div>
    @endif

    @include('pdf.partials.clinic-header')

    <div class="medical-certificate-title">MEDICAL CERTIFICATE</div>
    <div class="medical-certificate-reference-row">
        <span><b>Certificate No.:</b> {{ $display($certificate->certificate_number, 'Pending') }}</span>
        <span><b>Patient Ref.:</b> {{ $display($certificate->patient_reference_code, 'N/A') }}</span>
        @if($documentMode !== 'pdf')
            <span><b>Consultation:</b> {{ $consultationDate?->format('F j, Y') ?? 'N/A' }}</span>
        @endif
    </div>
    <div class="medical-certificate-date-row">
        Date:
        <span class="medical-certificate-inline-line medical-certificate-date-line">
            {{ $issuedDate?->format('F j, Y') }}
        </span>
    </div>

    <p class="medical-certificate-greeting">To whom it may concern:</p>

    <p class="medical-certificate-certification">
        This is to certify that {{ $salutation }}
        <span class="medical-certificate-inline-line medical-certificate-name-line">{{ $display($certificate->patient_name) }}</span>,<br>
        Age: <span class="medical-certificate-inline-line medical-certificate-age-line">{{ $display($certificate->patient_age) }}</span>,
        Sex: <span class="medical-certificate-inline-line medical-certificate-sex-line">{{ $display($certificate->patient_sex) }}</span>,
        Status: <span class="medical-certificate-inline-line medical-certificate-status-line">{{ $display($certificate->patient_civil_status) }}</span>,
        sought consultation at our clinic due to:
    </p>

    <div class="medical-certificate-ruled-block medical-certificate-ruled-block--three">
        <div class="medical-certificate-ruled-value">{{ $display($certificate->reason_for_consultation) }}</div>
    </div>

    <div class="medical-certificate-section-label">IMPRESSION:</div>
    <div class="medical-certificate-ruled-block medical-certificate-ruled-block--two">
        <div class="medical-certificate-ruled-value">{{ $display($certificate->clinical_impression) }}</div>
    </div>

    <div class="medical-certificate-section-label">RECOMMENDATION:</div>
    <div class="medical-certificate-ruled-block medical-certificate-ruled-block--two">
        <div class="medical-certificate-ruled-value">{{ $display($certificate->recommendation) }}</div>
    </div>

    <div class="medical-certificate-rest">
        Advised to rest from
        <span class="medical-certificate-inline-line medical-certificate-rest-line">{{ $restStart?->format('F j, Y') }}</span>
        to
        <span class="medical-certificate-inline-line medical-certificate-rest-line">{{ $restEnd?->format('F j, Y') }}</span>.
    </div>

    <div class="medical-certificate-issued-copy">
        This medical certificate was issued on the
        <span class="medical-certificate-inline-line medical-certificate-day-line">{{ $issuedDate?->format('j') }}</span>
        day of
        <span class="medical-certificate-inline-line medical-certificate-month-line">{{ $issuedDate?->format('F Y') }}</span>
        for whatever purpose this may serve the patient.
    </div>

    <section class="medical-certificate-signature" aria-label="Attending physician">
        <div class="medical-certificate-signature-mark">
            @if($issued && filled($signatureDataUri ?? null))
                <div class="medical-certificate-signature-image-container">
                <img class="medical-certificate-signature-image" src="{{ $signatureDataUri }}" alt="Attending physician electronic signature">
                </div>
            @endif
        </div>
        <div class="medical-certificate-signature-name">{{ strtoupper($display($certificate->physician_name)) }}, MD</div>
        <div class="medical-certificate-signature-role">ATTENDING PHYSICIAN</div>
        <div class="medical-certificate-license">
            LICENSE NO.
            <span class="medical-certificate-license-value">{{ $display($certificate->physician_license_no) }}</span>
        </div>
    </section>

    <footer class="medical-certificate-note">NOTE: This certificate is not for medico-legal purposes.</footer>
    @if($issued && filled($verificationQrDataUri ?? null))
        <div class="medical-certificate-verification">
            <img src="{{ $verificationQrDataUri }}" alt="Scan to verify this certificate">
            <a href="{{ $verificationUrl }}">Scan to verify / Verify online</a>
        </div>
    @endif
</article>
