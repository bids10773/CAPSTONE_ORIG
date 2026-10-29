<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        @include('pdf.partials.clinic-styles')
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #00a651; padding: 5px; text-align: left; vertical-align: top; }
        th { width: 30%; color: #009b4d; }
        h2 { color: #009b4d; font-size: 12px; margin-top: 16px; }
        .signature { margin: 35px 0 0 55%; }
    </style>
</head>
<body>
    @include('pdf.partials.clinic-header')
    <div class="title">PHYSICAL EXAMINATION REPORT</div>
    <table>
        <tr><th>Patient</th><td>{{ $appointment->user->name }}</td></tr>
        <tr><th>Date of examination</th><td>{{ $appointment->appointment_date?->format('F j, Y') }}</td></tr>
        <tr><th>Reference</th><td>{{ $appointment->reference_code }}</td></tr>
    </table>

    @if($history)
        <h2>Medical history</h2>
        <table>
            @foreach(['Present illness' => $history->present_illness, 'Past medical history' => $history->past_medical_history,
                'Operations / accidents' => $history->operations_accidents, 'Family history' => $history->family_history,
                'Allergies' => $history->allergies, 'Personal / social history' => $history->personal_social_history,
                'OB / menstrual history' => $history->ob_menstrual_history] as $label => $value)
                <tr><th>{{ $label }}</th><td>{{ $value ?: 'Not recorded' }}</td></tr>
            @endforeach
        </table>
    @endif

    <h2>Physical examination</h2>
    <table>
        @foreach(['Height (cm)' => $physical->height, 'Weight (kg)' => $physical->weight,
            'Blood pressure' => $physical->blood_pressure, 'Temperature (°C)' => $physical->temperature,
            'Pulse rate' => $physical->pulse_rate, 'Respiration rate' => $physical->respiration_rate,
            'Hearing' => $physical->hearing, 'Visual acuity' => $physical->visual_acuity, 'BMI' => $physical->bmi] as $label => $value)
            <tr><th>{{ $label }}</th><td>{{ $value ?? 'Not recorded' }}</td></tr>
        @endforeach
        @foreach(['Head / scalp' => 'head_scalp', 'Eyes' => 'eyes', 'Ears' => 'ears', 'Nose / sinuses' => 'nose_sinuses',
            'Mouth / throat' => 'mouth_throat', 'Neck / thyroid' => 'neck_thyroid', 'Chest / breasts' => 'chest_breast',
            'Lungs' => 'lungs', 'Heart' => 'heart', 'Abdomen' => 'abdomen', 'Back' => 'back', 'Anus' => 'anus',
            'Genitals' => 'genitals', 'Extremities' => 'extremities', 'Skin' => 'skin', 'Dental' => 'dental'] as $label => $field)
            <tr><th>{{ $label }}</th><td>{{ $physical->{$field} ?: ($physical->is_completed ? 'Normal' : 'Not recorded') }}</td></tr>
        @endforeach
        <tr><th>Remarks</th><td>{{ $physical->remarks ?: 'Not recorded' }}</td></tr>
    </table>

    <div class="signature">
        @include('pdf.partials.electronic-signature', ['staff' => $physical->doctor,
            'role' => 'Examining Physician', 'verifiedAt' => $physical->finalized_at])
    </div>
    @include('pdf.partials.report-verification')
</body>
</html>
