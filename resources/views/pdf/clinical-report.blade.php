<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>

        .meta, .fields { width: 100%; border-collapse: collapse; }
        .meta td { border-bottom: 1px solid #00a651; padding: 3px 5px; }
        .label { width: 18%; color: #009b4d; font-weight: bold; }
        .fields { margin-top: 8px; }
        .fields th, .fields td { border: 1px solid #00a651; padding: 3px 5px; vertical-align: top; }
        .fields th { width: 30%; color: #009b4d; text-align: left; }
        .signature { margin: 45px 0 0 55%; }
        .foot { position: fixed; bottom: -10px; width: 100%; color: #777; font-size: 8px; text-align: center; }
        @include('pdf.partials.clinic-styles')
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
    @include('pdf.partials.clinic-header')
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
@include('pdf.partials.report-verification')
</body>
</html>
