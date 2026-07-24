<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your staff account</title>
</head>
<body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
            <div style="padding:24px 28px;background:#2563eb;color:#ffffff">
                <strong style="font-size:18px">{{ $systemName }}</strong>
            </div>
            <div style="padding:28px">
                <h1 style="margin:0 0 16px;font-size:22px">Your staff account is ready</h1>
                <p>Hello {{ $staffName }},</p>
                <p>An account has been created for you in {{ $systemName }}.</p>
                <div style="margin:24px 0;padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
                    <p style="margin:0 0 10px"><strong>Login email:</strong> {{ $loginEmail }}</p>
                    <p style="margin:0"><strong>Temporary password:</strong> <span style="font-family:monospace">{{ $temporaryPassword }}</span></p>
                </div>
                <p>This temporary password expires {{ $expiresAt->format('F j, Y \a\t g:i A') }}. You will be required to create a new password immediately after signing in.</p>
                <p>Do not share these credentials with anyone.</p>
                <p style="margin:28px 0">
                    <a href="{{ $loginUrl }}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700">Sign in securely</a>
                </p>
                <p style="font-size:13px;color:#64748b">If you were not expecting this account, contact your clinic administrator.</p>
            </div>
        </div>
    </div>
</body>
</html>
