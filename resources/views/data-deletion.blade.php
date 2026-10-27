@php
    $policy = json_decode(file_get_contents(resource_path('content/privacy-policy.json')), true, 512, JSON_THROW_ON_ERROR);
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="index,follow">
  <title>Data Deletion Instructions | {{ config('app.name', 'Our Application') }}</title>
  <style>
    :root{--ink:#17324a;--muted:#586a7a;--accent:#225f83;--bg:#f5f8fb;--border:#dce5ed}*{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 system-ui,-apple-system,Segoe UI,sans-serif}
    header{background:#153c56;color:white;padding:32px 20px}header .inner,main,footer .inner{max-width:850px;margin:auto}
    header h1{margin:8px 0;font-size:clamp(1.8rem,4vw,2.5rem)}header p{color:#d9e9f3;margin:0}
    main{background:white;margin:28px auto;padding:clamp(22px,5vw,50px);border:1px solid var(--border);border-radius:18px}
    h2{margin:32px 0 8px;font-size:1.3rem}p{margin:10px 0}li{margin:8px 0}a{color:var(--accent)}a:focus-visible{outline:3px solid #f9a825;outline-offset:3px}
    .notice{background:#fff6dd;border-left:4px solid #df9c16;padding:14px 18px;border-radius:8px;margin:16px 0}
    .action{display:inline-block;background:#175b80;color:white;padding:11px 20px;border-radius:10px;text-decoration:none;font-weight:650;margin-top:8px}
    footer{padding:8px 20px 36px;color:var(--muted)}footer .inner{display:flex;gap:16px;flex-wrap:wrap}
  </style>
</head>
<body>
  <header><div class="inner"><a href="/" style="color:white">← Home</a><h1>Facebook-Linked Data Deletion</h1><p>{{ config('app.name', 'Our Application') }}</p></div></header>
  <main>
    <p>If you used Facebook Login with <strong>{{ $policy['contact']['name'] }}</strong>, you may request removal of the personal information we hold about your account, including data received from Facebook.</p>
    <h2>How to request deletion</h2>
    <ol>
      <li>Send an email to <a href="mailto:{{ $policy['contact']['email'] }}?subject=Facebook-Linked%20Data%20Deletion%20Request">{{ $policy['contact']['email'] }}</a> with the subject <strong>Facebook-Linked Data Deletion Request</strong>.</li>
      <li>State the email address associated with your account (if available) and that you want your account data deleted. <strong>Do not send your password, Facebook access token, or government IDs in the first email.</strong></li>
      <li>We will contact you through a secure method if further verification is required to confirm that you own the account.</li>
      <li>After verification, we will process the request according to our retention obligations and confirm the outcome by email. Contact the clinic for the expected processing timeframe and the status of your request.</li>
    </ol>
    <a class="action" href="mailto:{{ $policy['contact']['email'] }}?subject=Facebook-Linked%20Data%20Deletion%20Request">Email a deletion request</a>
    <h2>What information will be removed?</h2>
    <p>Your request can cover the Facebook user identifier linked to your LMIC account, the name and email provided during Facebook sign-in, and associated account and patient profile information. The clinic will review which information can be deleted or anonymized. Certain medical, administrative, or legally required records may need to be retained, as described in our Privacy Policy. The clinic will explain any information retained and confirm the outcome of your request.</p>
    <h2>How to disconnect Facebook Login</h2>
    <p>You can also disconnect this Application from Facebook by opening <strong>Facebook → Settings &amp; privacy → Settings → Apps and Websites</strong>, finding the Application, and removing its access. Menu labels may differ by device.</p>
    <p><strong>Note:</strong> Disconnecting the Application in Facebook does not automatically delete data already held in our Application. Use the deletion request instructions above for that.</p>
    <h2>Questions or follow-up</h2>
    <p>Contact <a href="mailto:{{ $policy['contact']['email'] }}">{{ $policy['contact']['email'] }}</a> and see our <a href="{{ url('/privacy-policy') }}">Privacy Policy</a> for details on data handling.</p>
  </main>
  <footer><div class="inner"><a href="{{ url('/terms') }}">Terms of Service</a><a href="{{ url('/privacy-policy') }}">Privacy Policy</a><a href="{{ url('/data-deletion') }}">Data Deletion</a></div></footer>
</body></html>
