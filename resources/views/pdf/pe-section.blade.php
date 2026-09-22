@php
    $profile = $appointment->user->patientProfile;
    $title = match ($section) {
        'medical-history' => 'Medical History',
        'physical-findings' => 'Physical Examination',
        'final-evaluation' => 'Final Medical Evaluation',
    };
    $historyFields = [
        'Present illness' => $history?->present_illness,
        'Past medical history' => $history?->past_medical_history,
        'Operations / accidents' => $history?->operations_accidents,
        'Family history' => $history?->family_history,
        'Allergies' => $history?->allergies,
        'Personal / social history' => $history?->personal_social_history,
        'OB / menstrual history' => $history?->ob_menstrual_history,
    ];
    $vitals = [
        'Height' => $physical->height ? $physical->height.' cm' : null,
        'Weight' => $physical->weight ? $physical->weight.' kg' : null,
        'Blood pressure' => $physical->blood_pressure,
        'Temperature' => $physical->temperature ? $physical->temperature.' °C' : null,
        'Pulse rate' => $physical->pulse_rate,
        'Respiration rate' => $physical->respiration_rate,
        'Hearing' => $physical->hearing,
        'Visual acuity' => $physical->visual_acuity,
        'BMI' => $physical->bmi,
    ];
    $findings = [
        'Head / scalp' => $physical->head_scalp, 'Eyes' => $physical->eyes,
        'Ears' => $physical->ears, 'Nose / sinuses' => $physical->nose_sinuses,
        'Mouth / throat' => $physical->mouth_throat, 'Neck / thyroid' => $physical->neck_thyroid,
        'Chest / breasts' => $physical->chest_breast, 'Lungs' => $physical->lungs,
        'Heart' => $physical->heart, 'Abdomen' => $physical->abdomen,
        'Back' => $physical->back, 'Anus' => $physical->anus,
        'Genitals' => $physical->genitals, 'Extremities' => $physical->extremities,
        'Skin' => $physical->skin, 'Dental' => $physical->dental,
    ];
    $evaluation = [
        'Medical classification' => $examination?->medical_classification,
        'Fit to work' => $examination?->fit_to_work === null ? null : ($examination->fit_to_work ? 'Yes' : 'No'),
        'Final diagnosis' => $examination?->final_diagnosis,
        'Remarks' => $examination?->final_remarks,
        'Recommendations' => $examination?->recommendations,
        'Finalized on' => $examination?->finalized_at?->format('F j, Y'),
    ];
@endphp
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        @page { size: letter portrait; margin: 28px; }
        body { font-family: DejaVu Sans, sans-serif; color: #26382b; font-size: 11px; }
        .header { border-bottom: 2px solid #455e4a; padding-bottom: 10px; text-align: center; }
        .header h1 { margin: 0; font-size: 21px; }
        .header p { margin: 3px 0 0; font-size: 9px; }
        h2 { margin: 20px 0 12px; text-align: center; font-size: 17px; }
        h3 { margin: 20px 0 6px; padding: 6px; background: #e3ede1; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #b8cbb8; padding: 7px; vertical-align: top; text-align: left; }
        th { width: 30%; color: #455e4a; }
        .meta { margin-bottom: 18px; }
        .signature { margin-top: 36px; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Living Myth Medical Clinic</h1>
        <p>2nd Floor, Serafin Business Center, National Highway Banlic, Cabuyao, Laguna</p>
    </div>
    <h2>{{ $title }}</h2>
    <table class="meta">
        <tr><th>Patient</th><td>{{ $appointment->user->name }}</td><th>Appointment</th><td>#{{ $appointment->id }}</td></tr>
        <tr><th>Age / Sex</th><td>{{ $profile?->birthdate?->age ?? '—' }} / {{ $profile?->sex ?? $appointment->user->sex ?? '—' }}</td><th>Date</th><td>{{ $appointment->appointment_date?->format('F j, Y') }}</td></tr>
        <tr><th>Company / agency</th><td colspan="3">{{ $appointment->company?->company_name ?? $appointment->company_name ?? 'OPD' }}</td></tr>
    </table>

    @if($section === 'medical-history')
        <h3>Medical history</h3>
        <table>@foreach($historyFields as $label => $value)<tr><th>{{ $label }}</th><td>{{ $value ?: '—' }}</td></tr>@endforeach</table>
    @elseif($section === 'physical-findings')
        <h3>Vital signs and measurements</h3>
        <table>@foreach($vitals as $label => $value)<tr><th>{{ $label }}</th><td>{{ $value ?? '—' }}</td></tr>@endforeach</table>
        <h3>Physical findings</h3>
        <table>@foreach($findings as $label => $value)<tr><th>{{ $label }}</th><td>{{ $value ?: 'Normal' }}</td></tr>@endforeach</table>
        @if($physical->remarks)<h3>Remarks</h3><p>{{ $physical->remarks }}</p>@endif
    @else
        <h3>Final evaluation</h3>
        <table>@foreach($evaluation as $label => $value)<tr><th>{{ $label }}</th><td>{{ $value ?? '—' }}</td></tr>@endforeach</table>
    @endif

    <div class="signature">{{ $section === 'final-evaluation' ? ($examination?->finalizedBy?->name ?? 'Authorized doctor') : ($physical->doctor?->name ?? 'Authorized doctor') }}<br>Physician</div>
</body>
</html>
