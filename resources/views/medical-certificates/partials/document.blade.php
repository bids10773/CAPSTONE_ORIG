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
    @page {
        size: A4 portrait;
        margin: 12mm 17mm;
    }

    * {
        box-sizing: border-box;
    }

    html,
    body {
        margin: 0;
        padding: 0;
    }

    body {
        color: #111;
        font-family: DejaVu Sans, Arial, sans-serif;
        font-size: 11.5pt;
        line-height: 1.35;
    }

    .medical-certificate-sheet {
        position: relative;
        width: 100%;
        min-height: 272mm;
        background: #fff;
    }

    .medical-certificate-header {
        width: 100%;
        border-collapse: collapse;
        border-bottom: 1.2px solid #1f1f1f;
    }

    .medical-certificate-header td {
        padding: 0 0 3.2mm;
        vertical-align: middle;
    }

    .medical-certificate-logo-cell {
        width: 22mm;
        padding-right: 2.5mm !important;
        text-align: center;
    }

    .medical-certificate-logo {
        display: block;
        width: 19mm;
        max-height: 16mm;
        margin: 0 auto;
        object-fit: contain;
    }

    .medical-certificate-logo-fallback {
        display: inline-block;
        border: 1px solid #4e9a68;
        padding: 3mm 2mm;
        color: #4e9a68;
        font-size: 10pt;
        font-weight: 700;
    }

    .medical-certificate-clinic {
        color: #59a66d;
        font-family: Arial, sans-serif;
        font-size: 24pt;
        font-weight: 700;
        line-height: 1.05;
        white-space: nowrap;
    }

    .medical-certificate-address,
    .medical-certificate-mobile {
        color: #4e9a68;
        font-size: 8.5pt;
        line-height: 1.35;
        text-align: center;
    }

    .medical-certificate-title {
        margin-top: 4.5mm;
        font-size: 13.5pt;
        font-weight: 700;
        text-align: center;
        text-decoration: underline;
        text-underline-offset: 1.2mm;
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
        margin: 18mm 0 10mm;
    }

    .medical-certificate-certification {
        margin: 0;
        line-height: 1.8;
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
        margin-top: 5.5mm;
        font-weight: 400;
        text-transform: uppercase;
    }

    .medical-certificate-ruled-block {
        position: relative;
        width: 100%;
    }

    .medical-certificate-ruled-block--three {
        min-height: 24mm;
    }

    .medical-certificate-ruled-block--two {
        min-height: 16mm;
    }

    .medical-certificate-rule {
        position: absolute;
        right: 0;
        left: 0;
        height: 0;
        border-bottom: 1px solid #111;
    }

    .medical-certificate-rule--one {
        top: 7.5mm;
    }

    .medical-certificate-rule--two {
        top: 15.5mm;
    }

    .medical-certificate-rule--three {
        top: 23.5mm;
    }

    .medical-certificate-ruled-value {
        position: relative;
        z-index: 1;
        padding: .2mm 1mm 0;
        line-height: 8mm;
        overflow-wrap: break-word;
        white-space: pre-line;
        word-wrap: break-word;
    }

    .medical-certificate-rest {
        margin-top: 7mm;
    }

    .medical-certificate-rest-line {
        width: 42mm;
    }

    .medical-certificate-issued-copy {
        max-width: 150mm;
        margin-top: 7mm;
        line-height: 1.5;
    }

    .medical-certificate-day-line {
        width: 32mm;
    }

    .medical-certificate-month-line {
        width: 42mm;
    }

    .medical-certificate-signature {
        position: absolute;
        right: 0;
        bottom: 27mm;
        width: 76mm;
        text-align: left;
    }

    .medical-certificate-signature-mark {
        position: relative;
        height: 19mm;
        border-bottom: 1.1px solid #111;
    }

    .medical-certificate-signature-name {
        overflow: hidden;
        margin-top: 1mm;
        font-size: 9.5pt;
        font-weight: 700;
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .medical-certificate-signature-md {
        position: absolute;
        right: 0;
        bottom: .5mm;
        font-size: 12pt;
    }

    .medical-certificate-signature-role,
    .medical-certificate-license {
        font-size: 11pt;
        font-weight: 700;
        line-height: 1.25;
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
        position: absolute;
        bottom: 2mm;
        left: 0;
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
                padding: 12mm 17mm;
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

    <table class="medical-certificate-header" role="presentation">
        <tr>
            <td class="medical-certificate-logo-cell" rowspan="3">
                @if($logoData)
                    <img class="medical-certificate-logo" src="{{ $logoData }}" alt="Living Myth Medical Clinic logo">
                @else
                    <span class="medical-certificate-logo-fallback">LMIC</span>
                @endif
            </td>
            <td class="medical-certificate-clinic">Living Myth Medical Clinic</td>
        </tr>
        <tr>
            <td class="medical-certificate-address">2nd Floor, Serafin Business Center, National Highway Banlic, Cabuyao, Laguna</td>
        </tr>
        <tr>
            <td class="medical-certificate-mobile">Mobile No. 0920-631-11-30</td>
        </tr>
    </table>

    <div class="medical-certificate-title">MEDICAL CERTIFICATE</div>
    <div class="medical-certificate-reference-row">
        <span><b>Certificate No.:</b> {{ $display($certificate->certificate_number, 'Pending') }}</span>
        <span><b>Patient Ref.:</b> {{ $display($certificate->patient_reference_code, 'N/A') }}</span>
        <span><b>Consultation:</b> {{ $consultationDate?->format('F j, Y') ?? 'N/A' }}</span>
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
        <span class="medical-certificate-rule medical-certificate-rule--one"></span>
        <span class="medical-certificate-rule medical-certificate-rule--two"></span>
        <span class="medical-certificate-rule medical-certificate-rule--three"></span>
        <div class="medical-certificate-ruled-value">{{ $display($certificate->reason_for_consultation) }}</div>
    </div>

    <div class="medical-certificate-section-label">IMPRESSION:</div>
    <div class="medical-certificate-ruled-block medical-certificate-ruled-block--two">
        <span class="medical-certificate-rule medical-certificate-rule--one"></span>
        <span class="medical-certificate-rule medical-certificate-rule--two"></span>
        <div class="medical-certificate-ruled-value">{{ $display($certificate->clinical_impression) }}</div>
    </div>

    <div class="medical-certificate-section-label">RECOMMENDATION:</div>
    <div class="medical-certificate-ruled-block medical-certificate-ruled-block--two">
        <span class="medical-certificate-rule medical-certificate-rule--one"></span>
        <span class="medical-certificate-rule medical-certificate-rule--two"></span>
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
            <span class="medical-certificate-signature-md">MD</span>
        </div>
        <div class="medical-certificate-signature-name">{{ strtoupper($display($certificate->physician_name)) }}</div>
        <div class="medical-certificate-signature-role">ATTENDING PHYSICIAN</div>
        <div class="medical-certificate-license">
            LICENSE NO.
            <span class="medical-certificate-license-value">{{ $display($certificate->physician_license_no) }}</span>
        </div>
    </section>

    <footer class="medical-certificate-note">NOTE: This certificate is not for medico-legal purposes.</footer>
</article>
