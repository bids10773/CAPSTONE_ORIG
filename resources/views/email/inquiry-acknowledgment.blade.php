<x-email.layout title="Inquiry Received" preheader="Living Myth Industrial Clinic has received your inquiry." :logo-src="$message->embed(public_path('images/email-logo.png'))">
    <p style="margin:0 0 8px;color:#6b8f71;font-size:13px;line-height:20px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Inquiry acknowledgment</p>
    <h1 style="margin:0;color:#1f2937;font-size:27px;line-height:35px;font-weight:700;">We received your inquiry</h1>
    <p style="margin:18px 0 0;color:#4b5563;font-size:15px;line-height:24px;">Hello {{ $senderName }},</p>
    <p style="margin:10px 0 0;color:#4b5563;font-size:15px;line-height:24px;">We have received your inquiry. Our clinic staff will review it and contact you if additional information is required.</p>
    <x-email.notice>Your reference number is <strong>{{ $reference }}</strong>. Sending an inquiry does not create or approve a company account.</x-email.notice>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:22px;">Please do not send medical records or sensitive clinical information by replying to this automated message.</p>
</x-email.layout>
