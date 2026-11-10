<x-email.layout title="Verify your email address" preheader="Verify your email address to finish setting up your secure clinic account." :logo-src="$message->embed(public_path('images/email-logo-optimized.png'))">
    <p style="margin:0 0 8px;color:#6b8f71;font-size:13px;line-height:20px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Account verification</p>
    <h1 style="margin:0;color:#1f2937;font-size:27px;line-height:35px;font-weight:700;">Hello, {{ $name }}!</h1>
    <p style="margin:18px 0 0;color:#4b5563;font-size:15px;line-height:24px;">The Living Myth Industrial Clinic system sent this link to verify the email address associated with your account.</p>
    <x-email.notice>This secure verification link is valid for {{ $expiresIn }} minutes.</x-email.notice>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:22px;">Select the button below to verify your email address:</p>
    <x-email.button :url="$url">Verify email address</x-email.button>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0;background-color:#f8faf8;border:1px solid #e3e9e3;border-radius:12px;">
        <tr>
            <td style="padding:18px 20px;">
                <p style="margin:0 0 14px;color:#56765c;font-size:12px;line-height:18px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;">Clinic details</p>
                <p style="margin:0 0 9px;color:#4b5563;font-size:13px;line-height:20px;"><strong>Address:</strong> 2/F, Serafin Business Center, National Highway, Cabuyao City, Laguna</p>
                <p style="margin:0 0 9px;color:#4b5563;font-size:13px;line-height:20px;"><strong>Contact:</strong> +63 922 889 6850</p>
                <p style="margin:0;color:#4b5563;font-size:13px;line-height:20px;"><strong>Schedule:</strong> Monday–Friday, 8:00 AM–5:00 PM<br><span style="color:#6b7280;font-size:12px;">Closed on weekends and public holidays</span></p>
            </td>
        </tr>
    </table>

    <p style="margin:22px 0 0;color:#9ca3af;font-size:11px;line-height:18px;"><strong>Confidentiality Notice:</strong> The contents of this email and any attachments are confidential and/or legally privileged and are intended solely for the addressee. Any use, reproduction, or dissemination by anyone other than the intended recipient is strictly prohibited.</p>
    <x-email.fallback-link :url="$url" />
</x-email.layout>
