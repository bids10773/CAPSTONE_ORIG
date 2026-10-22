<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 30px; }
        body { font-family: DejaVu Sans, sans-serif; color: #172019; font-size: 11px; }
        .head { border-bottom: 2px solid #16834b; padding-bottom: 8px; text-align: center; }
        .head h1 { margin: 0; color: #348f5c; font-size: 27px; }
        .title { margin: 18px; text-align: center; font-size: 18px; font-weight: bold; }
        .meta, .fields { width: 100%; border-collapse: collapse; }
        .meta td { border-bottom: 1px solid #35a66c; padding: 5px; }
        .label { width: 18%; color: #16834b; font-weight: bold; }
        .fields { margin-top: 18px; }
        .fields th, .fields td { border: 1px solid #35a66c; padding: 7px; vertical-align: top; }
        .fields th { width: 30%; color: #16834b; text-align: left; }
        .signature { margin: 45px 0 0 55%; }
        .foot { position: fixed; bottom: -10px; width: 100%; color: #777; font-size: 8px; text-align: center; }
    </style>
</head>
<body>
    @php
        $signer = $appointment->xrayReport?->verifiedBy
            ?? $appointment->xrayReport?->radiologist
            ?? $appointment->physicalExam?->doctor;
        $verifiedAt = $appointment->xrayReport?->verified_at
            ?? $appointment->physicalExam?->finalized_at;
    @endphp
    <div class="head">
        <h1>Living Myth Industrial Clinic</h1>
        <div>2nd Floor, Serafin Business Center, National Highway Banlic, Cabuyao, Laguna</div>
    </div>
    <div class="title">{{ strtoupper($title) }}</div>
    <table class="meta">
        <tr>
            <td class="label">Patient</td><td>{{ $appointment->user->name }}</td>
            <td class="label">Date</td><td>{{ $appointment->appointment_date?->format('m/d/Y') }}</td>
        </tr>
        <tr>
            <td class="label">Age / Sex</td>
            <td>{{ $appointment->user->patientProfile?->birthdate?->age ?? '—' }} / {{ $appointment->user->patientProfile?->sex ?? $appointment->user->sex ?? '—' }}</td>
            <td class="label">Company</td>
            <td>{{ $appointment->company?->company_name ?? $appointment->company_name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="label">Record reference</td><td colspan="3">{{ $appointment->reference_code }}</td>
        </tr>
    </table>
    <table class="fields">
        @foreach($fields as $label => $value)
            @if(! in_array($label, ['id', 'appointment_id', 'doctor_id', 'radiologist_id', 'created_at', 'updated_at', 'finalized_by'], true) && $value !== null)
                <tr>
                    <th>{{ str($label)->replace('_', ' ')->title() }}</th>
                    <td>{{ is_bool($value) ? ($value ? 'Yes' : 'No') : $value }}</td>
                </tr>
            @endif
        @endforeach
    </table>
    <div class="signature">
        @include('pdf.partials.electronic-signature', [
            'staff' => $signer,
            'role' => $appointment->xrayReport ? 'Radiologic Technologist' : 'Examining Physician',
            'verifiedAt' => $verifiedAt,
        ])
    </div>
    <div class="foot">Electronically generated and verified LMIC clinical document · {{ $appointment->reference_code }}</div>
</body>
</html>
