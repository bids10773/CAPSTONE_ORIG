<!doctype html>
<html lang="en">
<body style="margin:0;background:#f4f7f4;font-family:Arial,sans-serif;color:#1f2937">
<div style="max-width:620px;margin:32px auto;background:#fff;border:1px solid #dbe7dc;border-radius:16px;overflow:hidden">
    <div style="background:#456b4e;padding:28px;color:#fff">
        <h1 style="margin:0;font-size:24px">Your company portal is ready</h1>
        <p style="margin:8px 0 0">{{ $companyName }}</p>
    </div>
    <div style="padding:30px">
        <p>An administrator created your company account. Sign in with the secure temporary credentials below.</p>
        <div style="background:#f1f7f2;border:1px solid #c8ddcb;border-radius:10px;padding:18px">
            <p style="margin:0 0 10px"><strong>Email:</strong> {{ $loginEmail }}</p>
            <p style="margin:0"><strong>Temporary password:</strong> <code>{{ $temporaryPassword }}</code></p>
        </div>
        <p style="font-size:13px;color:#6b7280">This credential expires in 48 hours. You must replace it immediately after signing in.</p>
        <p style="margin:24px 0"><a href="{{ $loginUrl }}" style="background:#456b4e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px">Sign in securely</a></p>
        <p style="font-size:12px;color:#6b7280">If you were not expecting this account, contact the clinic administrator. Never forward these credentials.</p>
    </div>
</div>
</body>
</html>
