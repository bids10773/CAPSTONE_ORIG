<x-email.layout title="Reset Your Password" preheader="A password reset was requested for your clinic account." :logo-src="$message->embed(public_path('images/email-logo.png'))">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 18px;"><tr><td align="center" width="48" height="48" style="width:48px;height:48px;border-radius:12px;background-color:#e3ede1;color:#455e4a;font-size:25px;font-weight:700;">&#128274;</td></tr></table>
    <p style="margin:0 0 8px;color:#6b8f71;font-size:13px;line-height:20px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Account security</p>
    <h1 style="margin:0;color:#1f2937;font-size:27px;line-height:35px;font-weight:700;">Reset Your Password</h1>
    <p style="margin:18px 0 0;color:#4b5563;font-size:15px;line-height:24px;">Hello {{ $name }},</p>
    <p style="margin:10px 0 0;color:#4b5563;font-size:15px;line-height:24px;">We received a request to reset the password for your Living Myth Industrial Clinic account.</p>
    <x-email.notice tone="warning">This password reset link expires in {{ $expiresIn }} minutes and can only be used for this account.</x-email.notice>
    <x-email.button :url="$url">Reset Password</x-email.button>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:22px;">If you did not request a password reset, no further action is required. Your current password remains unchanged.</p>
    <x-email.fallback-link :url="$url" />
</x-email.layout>
