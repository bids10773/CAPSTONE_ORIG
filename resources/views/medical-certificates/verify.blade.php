<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
    <meta name="referrer" content="no-referrer">
    <title>{{ $documentLabel ?? 'Medical certificate' }} verification | Living Myth Medical Clinic</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; background: #f5f8f5; color: #18241c; font: 16px/1.6 system-ui, sans-serif; }
        main { width: min(100% - 32px, 640px); margin: 48px auto; background: #fff; border: 1px solid #dce5dd; border-radius: 20px; padding: clamp(24px, 5vw, 40px); }
        header { border-bottom: 1px solid #dce5dd; padding-bottom: 20px; }
        .clinic { font-weight: 700; color: #46624a; margin: 0; }
        h1 { font-size: clamp(24px, 5vw, 30px); line-height: 1.25; margin: 12px 0; }
        .status { display: inline-block; padding: 5px 14px; border-radius: 24px; background: #eaf6ee; color: #195b30; font-weight: 700; }
        .void { background: #fff0ed; color: #a42d1d; }
        dl { margin: 24px 0; } dl div { padding: 12px 0; border-bottom: 1px solid #edf0ed; }
        dt { color: #637267; font-size: 14px; } dd { margin: 3px 0 0; font-weight: 600; overflow-wrap: anywhere; }
        .notice { font-size: 14px; color: #637267; } a { color: #365e41; } a:focus-visible { outline: 3px solid #587e60; outline-offset: 4px; }
        footer { margin-top: 24px; }
    </style>
</head>
<body>
<main>
    <header>
        <p class="clinic">Living Myth Medical Clinic</p>
        <h1>{{ $documentLabel ?? 'Medical certificate' }} verification</h1>
        @if($verification)
            <span class="status {{ ($verification['valid'] ?? $verification['status'] === 'Issued') ? '' : 'void' }}">Status: {{ $verification['status'] }}</span>
        @endif
    </header>
    @if($verification)
        <p>{{ ($verification['valid'] ?? $verification['status'] === 'Issued') ? 'This document matches an official clinic record.' : 'This document has been voided or withdrawn and is no longer current. Please contact the clinic.' }}</p>
        <dl>
            <div><dt>{{ isset($documentLabel) ? 'Document reference' : 'Certificate number' }}</dt><dd>{{ $verification['number'] }}</dd></div>
            <div><dt>{{ $verification['holderLabel'] ?? 'Patient (masked)' }}</dt><dd>{{ $verification['patient'] }}</dd></div>
            <div><dt>{{ isset($documentLabel) ? 'Authorized professional / issuer' : 'Issuing physician' }}</dt><dd>{{ $verification['physician'] ?? 'Not recorded' }}</dd></div>
            <div><dt>{{ isset($documentLabel) ? 'Finalized / released date' : 'Issue date' }}</dt><dd>{{ $verification['issuedDate'] ?? 'Not recorded' }}</dd></div>
        </dl>
        <p class="notice">Compare these details with the document you received. This page confirms the clinic record and its current status; contact the clinic if the document details differ.</p>
    @else
        <h2>Document not found</h2>
        <p>We could not verify this document. Check the link or contact the clinic.</p>
    @endif
    <p class="notice">Medical findings, recommendations, and signature images are kept private.</p>
    <footer><a href="/">Visit the clinic website</a></footer>
</main>
</body>
</html>
