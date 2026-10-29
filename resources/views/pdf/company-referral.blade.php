<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>

        .code { margin: 26px 0; border: 2px dashed #009b4d; padding: 18px; text-align: center; }
        .code small { display: block; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .code strong { display: block; margin-top: 7px; font-size: 24px; letter-spacing: 2px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 3px 5px; border-bottom: 1px solid #00a651; vertical-align: top; }
        td:first-child { width: 34%; color: #009b4d; font-weight: bold; }
        .services { margin-top: 20px; }
        .services li { margin-bottom: 6px; }
        .footer { margin-top: 28px; color: #64748b; font-size: 10px; text-align: center; }
        @include('pdf.partials.clinic-styles')
    </style>
</head>
<body>
    @include('pdf.partials.clinic-header')

    <div class="title">COMPANY MEDICAL REFERRAL</div>

    <div class="code">
        <small>Referral Code</small>
        <strong>{{ $referral->referral_number }}</strong>
    </div>

    <table>
        <tr><td>Referred employee</td><td>{{ trim($referral->first_name.' '.$referral->middle_name.' '.$referral->last_name) }}</td></tr>
        <tr><td>Referring company</td><td>{{ $referral->company->company_name }}</td></tr>
        <tr><td>Medical purpose</td><td>{{ match ($referral->examination_purpose) { 'pre_employment' => 'Pre-employment', 'medical_clearance' => 'Medical Certificate', 'annual_pe' => 'Annual Examination', default => str($referral->examination_purpose)->replace('_', ' ')->title() } }}</td></tr>
        <tr><td>Valid until</td><td>{{ $referral->valid_until->format('F j, Y') }}</td></tr>
        <tr><td>Status</td><td>{{ str($referral->status)->replace('_', ' ')->title() }}</td></tr>
    </table>

    <div class="services">
        <strong>Required medical services</strong>
        <ul>
            @foreach($referral->required_services as $service)
                <li>{{ $service }}</li>
            @endforeach
        </ul>
    </div>

    <div class="footer">Present this referral code to the clinic when coordinating your company-referred medical appointment.</div>
</body>
</html>
