<x-email.layout title="Password Successfully Changed" preheader="The password for your clinic account was recently changed." :logo-src="$message->embed(public_path('images/email-logo.png'))">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 18px;"><tr><td align="center" width="48" height="48" style="width:48px;height:48px;border-radius:24px;background-color:#e3ede1;color:#455e4a;font-size:24px;font-weight:700;">&#10003;</td></tr></table>
    <p style="margin:0 0 8px;color:#6b8f71;font-size:13px;line-height:20px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Security confirmation</p>
    <h1 style="margin:0;color:#1f2937;font-size:27px;line-height:35px;font-weight:700;">Password Successfully Changed</h1>
    <p style="margin:18px 0 0;color:#4b5563;font-size:15px;line-height:24px;">Hello {{ $name }},</p>
    <p style="margin:10px 0 0;color:#4b5563;font-size:15px;line-height:24px;">The password for your Living Myth Industrial Clinic account was recently updated.</p>
    <x-email.notice tone="warning">If you did not make this change, contact the clinic or system administrator immediately and secure your account.</x-email.notice>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:22px;">For your protection, this message does not contain your password or any medical information.</p>
</x-email.layout>
