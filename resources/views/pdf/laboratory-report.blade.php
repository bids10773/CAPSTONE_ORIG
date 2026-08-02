<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
    @page { margin: 24px 28px; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: DejaVu Sans, sans-serif; color: #111827; font-size: 10px; }
    .green { color: #009b4d; } .border { border: 1px solid #00a651; }
    .header { text-align: center; border-bottom: 1.5px solid #00a651; padding-bottom: 6px; }
    .header img { float:left; width:52px; height:52px; object-fit:contain; }
    .header h1 { margin: 0; color:#339966; font-size:27px; letter-spacing:1px; }
    .header p { margin:2px 0 0; color:#009b4d; font-size:10px; }
    .title { text-align:center; color:#009b4d; font-size:16px; font-weight:bold; margin:7px 0; }
    .patient { width:100%; border-collapse:collapse; margin-bottom:8px; }
    .patient td { padding:3px 5px; border-bottom:1px solid #00a651; }
    .patient .label { width:13%; color:#009b4d; font-weight:bold; border-bottom:0; }
    .section { margin-bottom:9px; page-break-inside:avoid; }
    .section h2 { margin:0; padding:3px 5px; border:1px solid #00a651; color:#009b4d; font-size:13px; }
    table.results { width:100%; border-collapse:collapse; }
    .results th,.results td { border:1px solid #00a651; padding:3px 5px; }
    .results th { color:#009b4d; font-weight:bold; text-transform:uppercase; }
    .results td.value { width:28%; text-align:center; font-weight:bold; }
    .results td.normal { width:30%; text-align:center; color:#008f46; }
    .signatures { width:100%; margin-top:24px; page-break-inside:avoid; }
    .signatures td { width:50%; text-align:center; vertical-align:bottom; padding:0 25px; }
    .signature-line { border-bottom:1px solid #00a651; min-height:28px; padding-top:12px; font-weight:bold; }
    .role { color:#009b4d; font-weight:bold; font-size:11px; }
    .remarks { border:1px solid #00a651; padding:5px; min-height:30px; }
    .footer { position:fixed; bottom:-12px; width:100%; text-align:center; color:#6b7280; font-size:8px; }
</style>
</head>
<body>
<div class="header">
    @if(file_exists(public_path('images/lmic_logo.png')))<img src="{{ public_path('images/lmic_logo.png') }}" alt="LMIC">@endif
    <h1>Living Myth Industrial Clinic</h1>
    <p>2nd Floor, Serafin Business Center, National Highway Banlic, Cabuyao, Laguna</p>
    <p>Telephone No. (049) 576-0715</p>
</div>
<div class="title">LABORATORY RESULT</div>
<table class="patient">
    <tr><td class="label">Name</td><td>{{ $patient['name'] }}</td><td class="label">Company/Agency</td><td>{{ $patient['company'] }}</td></tr>
    <tr><td class="label">Age/Sex</td><td>{{ $patient['age'] ?? '—' }}/{{ strtoupper(substr($patient['sex'] ?? '—', 0, 1)) }}</td><td class="label">Date</td><td>{{ $result->finalized_at?->format('m/d/Y') ?? $patient['date'] }}</td></tr>
    @if($patient['employee_number'])<tr><td class="label">Employee No.</td><td>{{ $patient['employee_number'] }}</td><td class="label">Appointment</td><td>#{{ $appointment->id }}</td></tr>@endif
</table>

@foreach($sections as $sectionKey => $section)
    @php
        $stored = $result->{$section['column']};
        if ($sectionKey === 'pregnancy' && ! is_array($stored)) $stored = ['pregnancy_test' => $stored];
        if ($sectionKey === 'blood_type' && ! is_array($stored)) $stored = ['blood_type' => $stored];
        $stored = is_array($stored) ? $stored : [];
    @endphp
    <div class="section">
        <h2>{{ strtoupper($section['label']) }}</h2>
        <table class="results">
            <thead><tr><th>Examination</th><th>Normal Values</th><th>Results</th></tr></thead>
            <tbody>
            @foreach($section['fields'] as $field)
                <tr>
                    <td>{{ $field['label'] }}</td>
                    <td class="normal">{{ $field['normal'] ?: '—' }} @if($field['normal'] && $field['unit']) {{ $field['unit'] }} @endif</td>
                    <td class="value">{{ $stored[$field['key']] ?? '—' }} @if(($stored[$field['key']] ?? null) && $field['unit']) {{ $field['unit'] }} @endif</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endforeach

@if($result->remarks)<div class="section"><h2>REMARKS</h2><div class="remarks">{{ $result->remarks }}</div></div>@endif

<table class="signatures"><tr>
    <td><div class="signature-line">DR. DEXTER A. LEDESMA M.D.</div><div>LIC. NO. 0089730</div><div class="role">Pathologist</div></td>
    <td><div class="signature-line">{{ strtoupper($result->verifiedBy?->name ?? $result->encodedBy?->name ?? 'MEDICAL TECHNOLOGIST') }}</div><div>{{ $result->verifiedBy?->license_no ? 'LIC. NO. '.$result->verifiedBy->license_no : '' }}</div><div class="role">Medical Technologist</div></td>
</tr></table>
<div class="footer">Electronically generated LMIC clinical document · Appointment #{{ $appointment->id }} · {{ now()->format('Y-m-d H:i') }}</div>
</body>
</html>
