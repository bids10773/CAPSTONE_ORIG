<x-email.layout title="Response to Your Inquiry" preheader="Living Myth Industrial Clinic responded to your inquiry." :logo-src="$message->embed(public_path('images/email-logo.png'))">
    <p style="margin:0 0 8px;color:#6b8f71;font-size:13px;line-height:20px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Inquiry response</p>
    <h1 style="margin:0;color:#1f2937;font-size:27px;line-height:35px;font-weight:700;">A response from LMIC</h1>
    <p style="margin:18px 0 0;color:#4b5563;font-size:15px;line-height:24px;">Hello {{ $senderName }},</p>
    <p style="margin:10px 0;color:#4b5563;font-size:15px;line-height:24px;white-space:pre-line;">{{ $responseText }}</p>
    <x-email.notice>Your inquiry reference is <strong>{{ $reference }}</strong>.</x-email.notice>
</x-email.layout>
