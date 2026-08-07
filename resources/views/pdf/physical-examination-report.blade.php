@php
    $green = '#455e4a';
    $mossDark = '#303f34';
    $mossSoft = '#e3ede1';
    $logoFile = public_path('images/full_logo2.png');
    $logoData = is_file($logoFile) ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoFile)) : null;
    $profile = $appointment->user->patientProfile;
    $diagnostics = $examination?->diagnosticResults?->keyBy('service_key') ?? collect();
    $diagnostic = fn (string $key) => $diagnostics->get($key);
    $verified = fn (string $key) => $diagnostic($key)?->status === 'verified';
    $tick = fn (bool $condition) => $condition ? '/' : ' ';
    $labValue = function ($data, string $key) {
        return is_array($data) && filled($data[$key] ?? null) ? $data[$key] : null;
    };
    $isRequested = fn (string $service) => in_array($service, $appointment->service_types ?? [], true);
    $drugSummary = data_get($diagnostic('drug_test')?->result_data, 'summary');
    $drugNegative = $drugSummary === 'negative';
    $drugPositive = $drugSummary === 'positive_confirmed';
    $xrayNormal = $xray?->isVerified() && str_contains(strtolower((string) $xray->impression), 'normal');
    $xrayFindings = $xray?->isVerified() && ! $xrayNormal;
    $classification = $examination?->medical_classification;
    $systemFindings = [
        'Head/Scalp' => $physical->head_scalp, 'Eyes' => $physical->eyes,
        'Ears' => $physical->ears, 'Nose/Sinuses' => $physical->nose_sinuses,
        'Mouth/Throat' => $physical->mouth_throat, 'Neck/Thyroid' => $physical->neck_thyroid,
        'Chest/Breasts' => $physical->chest_breast, 'Lungs' => $physical->lungs,
        'Heart' => $physical->heart, 'Abdomen' => $physical->abdomen,
        'Back' => $physical->back, 'Anus' => $physical->anus,
        'Genitals' => $physical->genitals, 'Extremities' => $physical->extremities,
        'Skin' => $physical->skin, 'Dental' => $physical->dental,
    ];
@endphp
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { size: letter portrait; margin: 14px 18px 12px; }
        * { box-sizing: border-box; }
        body { margin: 0; color: {{ $green }}; font-family: DejaVu Sans, Arial, sans-serif; font-size: 7.4px; line-height: 1.12; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 1px 2px; vertical-align: middle; }
        .ruled { border: .8px solid {{ $green }}; }
        .ruled td, .ruled th { border: .55px solid {{ $green }}; }
        .line { display: inline-block; min-height: 10px; border-bottom: .6px solid {{ $green }}; color: #111; text-align: center; }
        .black { color: #111; }
        .bold { font-weight: 700; }
        .center { text-align: center; }
        .right { text-align: right; }
        .section { height: 15px; padding: 1px 3px; border: .8px solid {{ $green }}; background: {{ $mossSoft }}; color: {{ $mossDark }}; font-size: 9.8px; font-weight: 800; }
        .header { height: 76px; border-bottom: .8px solid {{ $green }}; position: relative; text-align: center; }
        .logo-box { position: absolute; top: 5px; left: 20px; width: 58px; height: 51px; padding: 2px; border: 1px solid {{ $green }}; background: {{ $mossSoft }}; overflow: hidden; }
        .logo-box img { width: 54px; height: 47px; }
        .clinic { padding-top: 10px; color: {{ $mossDark }}; font-size: 21px; font-weight: 900; letter-spacing: .3px; }
        .clinic-address { margin-top: 4px; font-size: 8px; }
        .report-title { font-size: 11px; font-weight: 900; }
        .patient-box { height: 69px; }
        .photo { width: 83px; text-align: center; }
        .photo-frame { width: 68px; height: 48px; margin: 4px auto; border: .8px solid {{ $green }}; padding-top: 15px; font-size: 8px; }
        .patient-label { width: 105px; font-size: 9px; font-weight: 800; }
        .history-physical { table-layout: fixed; }
        .history { width: 52%; border-right: .8px solid {{ $green }}; }
        .systems { width: 48%; }
        .entry-table td { height: 13px; padding: 0 3px; }
        .entry-label { width: 47%; font-size: 8.4px; }
        .entry-value { color: #111; border-bottom: .55px solid {{ $green }}; text-align: center; }
        .systems-table th { height: 14px; font-size: 8.5px; }
        .systems-table td { height: 13px; font-size: 8px; }
        .systems-table .part { width: 29%; }
        .systems-table .normal { width: 22%; text-align: center; color: #111; }
        .systems-table .finding { color: #111; }
        .diagnostic td { height: 13px; font-size: 8.1px; }
        .diagnostic .test { width: 34%; }
        .diagnostic .choice { width: 18%; }
        .diagnostic .notes { color: #111; border-bottom: .55px solid {{ $green }}; }
        .class-area { table-layout: fixed; }
        .class-list { width: 66%; padding: 3px; vertical-align: top; }
        .cert { width: 34%; vertical-align: top; text-align: center; }
        .class-row { min-height: 15px; font-size: 7.6px; }
        .remarks-label { width: 58px; font-weight: 700; }
        .remarks-line { height: 13px; border-bottom: .55px solid {{ $green }}; color: #111; }
        .bmi-title, .cert-title { border-bottom: .55px solid {{ $green }}; background: {{ $mossSoft }}; color: {{ $mossDark }}; font-size: 8.4px; font-weight: 800; }
        .bmi-value { height: 17px; border-bottom: .55px solid {{ $green }}; color: #111; font-size: 8.5px; }
        .cert-text { padding: 4px 16px; font-size: 7.4px; line-height: 1.35; }
        .signatures { table-layout: fixed; }
        .signatures td { height: 31px; text-align: center; vertical-align: bottom; }
        .signature-name { border-bottom: .55px solid {{ $green }}; color: #111; font-size: 7.5px; }
        .signature-role { font-size: 6.8px; }
        .conclusion { padding-top: 7px; color: #244080; text-align: center; font-size: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-box">@if($logoData)<img src="{{ $logoData }}" alt="LMIC Logo">@else LMIC @endif</div>
        <div class="clinic">Living Myth Medical Clinic</div>
        <div class="clinic-address">2nd Floor, Serafin Business Center, National Highway Banlic, Cabuyao, Laguna</div>
        <div class="clinic-address">Mobile No. 0920-631-1130</div>
        <div class="report-title">Medical Examination Report</div>
    </div>

    <table class="ruled patient-box">
        <tr>
            <td rowspan="4" class="photo"><div class="photo-frame">1 X 1<br>ID Picture</div></td>
            <td class="patient-label">Name</td>
            <td><span class="line" style="width:100%">{{ strtoupper($appointment->user->name) }}</span></td>
            <td class="patient-label">AGE / SEX</td>
            <td><span class="line" style="width:100%">{{ $profile?->birthdate?->age ?? '—' }}/{{ strtoupper(substr($profile?->sex ?? $appointment->user->sex ?? '—', 0, 1)) }}</span></td>
        </tr>
        <tr><td class="patient-label">Address</td><td><span class="line" style="width:100%">{{ $profile?->address ?? '' }}</span></td><td class="patient-label">Civil Status</td><td class="black center">{{ strtoupper($profile?->civil_status ?? '') }}</td></tr>
        <tr><td class="patient-label">Company/Agency</td><td><span class="line" style="width:100%">{{ strtoupper($appointment->company?->company_name ?? $appointment->company_name ?? 'OPD') }}</span></td><td colspan="2"></td></tr>
        <tr><td class="patient-label">Date of Examination</td><td><span class="line" style="width:100%">{{ $examination?->examination_date?->format('m/d/Y') ?? $appointment->appointment_date?->format('m/d/Y') }}</span></td><td colspan="2"></td></tr>
    </table>

    <table class="ruled history-physical"><tr>
        <td class="history">
            <div class="section" style="border-width:0 0 .8px 0">I. MEDICAL HISTORY</div>
            <table class="entry-table">
                @foreach ([
                    'A. Present Illness' => $history?->present_illness,
                    'B. Past Medical History' => $history?->past_medical_history,
                    'C. Operation(s)/ Accident(s)' => $history?->operations_accidents,
                    'D. Family History' => $history?->family_history,
                    'E. Allergies' => $history?->allergies,
                    'F. Personal/ Social History' => $history?->personal_social_history,
                    'G. OB/ Menstrual History' => $history?->ob_menstrual_history,
                ] as $label => $entry)
                    <tr><td class="entry-label">{{ $label }}</td><td class="entry-value">{{ $entry ?: '—' }}</td></tr>
                @endforeach
            </table>
            <div class="section" style="border-width:.8px 0">II. PHYSICAL EXAMINATION</div>
            <table class="entry-table">
                <tr><td class="entry-label">A. Height</td><td class="entry-value">{{ $physical->height ? $physical->height.' CM' : '—' }}</td></tr>
                <tr><td class="entry-label">B. Weight</td><td class="entry-value">{{ $physical->weight ? $physical->weight.' KG' : '—' }}</td></tr>
                <tr><td class="entry-label">C. Blood Pressure</td><td class="entry-value">{{ $physical->blood_pressure ?: '—' }}</td></tr>
                <tr><td class="entry-label">D. Temperature</td><td class="entry-value">{{ $physical->temperature ? $physical->temperature.' °C' : '—' }}</td></tr>
                <tr><td class="entry-label">E. Pulse Rate</td><td class="entry-value">{{ $physical->pulse_rate ?: '—' }}</td></tr>
                <tr><td class="entry-label">F. Respiration</td><td class="entry-value">{{ $physical->respiration_rate ?: '—' }}</td></tr>
                <tr><td class="entry-label">G. Hearing</td><td class="entry-value">{{ strtoupper($physical->hearing ?: '—') }}</td></tr>
                <tr><td class="entry-label">H. Visual Acuity</td><td class="entry-value">{{ strtoupper($physical->visual_acuity ?: '—') }}</td></tr>
            </table>
        </td>
        <td class="systems">
            <table class="ruled systems-table" style="border:0">
                <tr><th class="part"></th><th>Normal</th><th>Findings</th></tr>
                @foreach ($systemFindings as $label => $finding)
                    <tr><td class="part">{{ $label }}</td><td class="normal">{{ blank($finding) ? '/' : '' }}</td><td class="finding">{{ $finding }}</td></tr>
                @endforeach
            </table>
        </td>
    </tr></table>

    <div class="section">III. LABORATORY</div>
    <table class="ruled diagnostic">
        <tr><td class="test">A. Complete Blood Count</td><td class="choice">[ {{ $tick($verified('cbc')) }} ] Normal</td><td class="choice">[ {{ $tick(false) }} ] Findings</td><td class="notes">{{ $verified('cbc') ? 'SEE ATTACHED RESULT' : '' }}</td></tr>
        <tr><td class="test">B. Urinalysis</td><td class="choice">[ {{ $tick($verified('urinalysis')) }} ] Normal</td><td class="choice">[ {{ $tick(false) }} ] Findings</td><td class="notes">{{ $verified('urinalysis') ? 'SEE ATTACHED RESULT' : '' }}</td></tr>
        <tr><td class="test">C. Fecalysis</td><td class="choice">[ {{ $tick($verified('fecalysis')) }} ] Normal</td><td class="choice">[ {{ $tick(false) }} ] Findings</td><td class="notes">{{ $verified('fecalysis') ? 'SEE ATTACHED RESULT' : '' }}</td></tr>
        @php $hbsag = strtolower((string) $labValue($laboratory?->serology_results, 'hbsag')); $hav = strtolower((string) $labValue($laboratory?->serology_results, 'anti_hav_igm')); @endphp
        <tr><td class="test">D. Hepatitis B (HBs Ag)</td><td class="choice">[ {{ $tick(str_contains($hbsag, 'non')) }} ] Non-reactive</td><td class="choice">[ {{ $tick($hbsag === 'reactive') }} ] Reactive</td><td class="notes">{{ $verified('serology') ? 'SEE ATTACHED RESULT' : '' }}</td></tr>
        <tr><td class="test">E. Hepatitis A (Anti-HAV IgM)</td><td class="choice">[ {{ $tick(str_contains($hav, 'non')) }} ] Non-reactive</td><td class="choice">[ {{ $tick($hav === 'reactive') }} ] Reactive</td><td class="notes"></td></tr>
        @php $pregnancy = strtolower((string) (is_array($laboratory?->pregnancy_test) ? data_get($laboratory->pregnancy_test, 'pregnancy_test') : $laboratory?->pregnancy_test)); @endphp
        <tr><td class="test">F. Pregnancy Test</td><td class="choice">[ {{ $tick($pregnancy === 'negative') }} ] Negative</td><td class="choice">[ {{ $tick($pregnancy === 'positive') }} ] Positive</td><td class="notes"></td></tr>
        <tr><td colspan="4">G. Drug Test</td></tr>
        <tr><td class="test" style="padding-left:14px">a. Methamphetamine (Shabu)</td><td class="choice">[ {{ $tick($drugNegative) }} ] Negative</td><td class="choice">[ {{ $tick($drugPositive) }} ] Positive</td><td class="notes"></td></tr>
        <tr><td class="test" style="padding-left:14px">b. Marijuana</td><td class="choice">[ {{ $tick($drugNegative) }} ] Negative</td><td class="choice">[ {{ $tick($drugPositive) }} ] Positive</td><td class="notes"></td></tr>
    </table>

    <div class="section">IV. CHEST X-RAY</div>
    <table class="ruled diagnostic"><tr><td class="test">Chest X-ray</td><td class="choice">[ {{ $tick($xrayNormal) }} ] Normal Chest</td><td class="choice">[ {{ $tick($xrayFindings) }} ] Findings</td><td class="notes">{{ $xray?->isVerified() ? 'SEE ATTACHED RESULT' : '' }}</td></tr></table>

    <div class="section">V. ELECTROCARDIOGRAM / AUDIOMETRY</div>
    <table class="ruled diagnostic">
        <tr><td class="test bold">Electrocardiogram (ECG)</td><td class="choice">[ ] Normal</td><td class="choice">[ ] Findings</td><td class="notes">{{ $isRequested('ECG') ? 'SEE ATTACHED RESULT' : '' }}</td></tr>
        <tr><td class="test bold">Audiometry</td><td class="choice">[ ] Normal</td><td class="choice">[ ] Findings</td><td class="notes">{{ $isRequested('Audiometry') ? 'SEE ATTACHED RESULT' : '' }}</td></tr>
    </table>

    <div class="section">VI. OTHERS</div>
    <table class="ruled diagnostic"><tr><td class="test bold">BLOOD CHEM</td><td class="choice">[ {{ $tick($verified('blood_chemistry')) }} ] Normal</td><td class="choice">[ ] Findings</td><td class="notes">{{ $verified('blood_chemistry') ? 'SEE ATTACHED RESULT' : '' }}</td></tr></table>

    <table class="ruled class-area"><tr>
        <td class="class-list">
            <div class="class-row">[ {{ $tick($classification === 'Class A') }} ] CLASS A &nbsp;&nbsp; Physically fit for all types of work. Has no noted defects.</div>
            <div class="class-row">[ {{ $tick($classification === 'Class B') }} ] CLASS B &nbsp;&nbsp; Physically fit for all types of work. Has minor defect(s) or ailment(s)<br><span style="padding-left:76px">that is easily curable and offers no handicap to job applied for.</span></div>
            <div class="class-row">[ {{ $tick($classification === 'Class C') }} ] CLASS C &nbsp;&nbsp; Employment at the risk and under the discretion of management.</div>
            <div class="class-row">[ {{ $tick($classification === 'Pending') }} ] PENDING</div>
            <table><tr><td class="remarks-label">REMARKS</td><td class="remarks-line">{{ strtoupper($examination?->final_remarks ?: $physical->doctor_remarks ?: '') }}</td></tr><tr><td></td><td class="remarks-line">{{ strtoupper($examination?->recommendations ?: '') }}</td></tr><tr><td></td><td class="remarks-line"></td></tr></table>
        </td>
        <td class="cert">
            <div class="bmi-title">BODY MASS INDEX (BMI)</div>
            <div class="bmi-value">{{ $physical->bmi ?? '—' }}</div>
            <div class="cert-title">CERTIFICATION</div>
            <div class="cert-text">"I certify that I am the same person whose name and picture appears on this medical record, and that I have truthfully answered all the questions asked regarding my person being medically examined."</div>
        </td>
    </tr></table>

    <table class="ruled signatures">
        <tr>
            <td><div class="signature-name">{{ strtoupper($examination?->finalizedBy?->name ?? '') }}</div><div class="signature-role">CLASSIFIED BY:</div></td>
            <td><div class="signature-name">{{ strtoupper($physical->doctor?->name ?? $examination?->examiningDoctor?->name ?? '') }}</div><div class="signature-role">Examining Physician</div></td>
            <td><div class="signature-name">{{ strtoupper($appointment->user->name) }}</div><div class="signature-role">Signature Over Printed Name</div></td>
        </tr>
    </table>
    <div class="conclusion">{{ strtoupper($examination?->final_diagnosis ?: '') }}</div>
</body>
</html>
