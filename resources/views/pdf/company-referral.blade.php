<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 34px; }
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 12px; }
        .header { border-bottom: 2px solid #39734d; padding-bottom: 14px; text-align: center; }
        h1 { margin: 0; color: #39734d; font-size: 22px; }
        .subtitle { margin-top: 5px; color: #64748b; }
        .code { margin: 26px 0; border: 2px dashed #39734d; padding: 18px; text-align: center; }
        .code small { display: block; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .code strong { display: block; margin-top: 7px; font-size: 24px; letter-spacing: 2px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 9px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        td:first-child { width: 34%; color: #64748b; font-weight: bold; }
        .services { margin-top: 20px; }
        .services li { margin-bottom: 6px; }
        .footer { margin-top: 28px; color: #64748b; font-size: 10px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Living Myth Industrial Clinic</h1>
        <div class="subtitle">Company Medical Referral</div>
    </div>

    <div class="code">
        <small>Referral Code</small>
        <strong>{{ $referral->referral_number }}</strong>
    </div>

    <table>
        <tr><td>Referred employee</td><td>{{ trim($referral->first_name.' '.$referral->middle_name.' '.$referral->last_name) }}</td></tr>
        <tr><td>Referring company</td><td>{{ $referral->company->company_name }}</td></tr>
        <tr><td>Medical purpose</td><td>{{ str($referral->examination_purpose)->replace('_', ' ')->title() }}</td></tr>
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
