<x-email.layout title="Medical Examination Referral" preheader="{{ $companyName }} invited you to complete a medical examination." :logo-src="$message->embed(public_path('images/email-logo.png'))">
    <p style="margin:0 0 8px;color:#6b8f71;font-size:13px;line-height:20px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Company referral</p>
    <h1 style="margin:0;color:#1f2937;font-size:27px;line-height:35px;font-weight:700;">You have been referred for a medical examination</h1>
    <p style="margin:18px 0 0;color:#4b5563;font-size:15px;line-height:24px;">Hello {{ $employeeName }},</p>
    <p style="margin:10px 0 0;color:#4b5563;font-size:15px;line-height:24px;"><strong>{{ $companyName }}</strong> invited you to complete a medical examination at Living Myth Industrial Clinic.</p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;background-color:#f8faf8;border:1px solid #dfe8df;border-radius:12px;">
        <tr>
            <td style="padding:18px 20px;">
                <p style="margin:0 0 14px;color:#56765c;font-size:12px;line-height:18px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;">Referral details</p>
                <p style="margin:0 0 9px;color:#4b5563;font-size:14px;line-height:21px;"><strong>Referral number:</strong> {{ $referralNumber }}</p>
                <p style="margin:0 0 9px;color:#4b5563;font-size:14px;line-height:21px;"><strong>Medical purpose:</strong> {{ $examinationPurpose }}</p>
                <p style="margin:0;color:#4b5563;font-size:14px;line-height:21px;"><strong>Valid until:</strong> {{ $validUntil->format('F j, Y') }}</p>
            </td>
        </tr>
    </table>

    <p style="margin:0;color:#6b7280;font-size:14px;line-height:22px;">Open your secure invitation to review the required services, download your referral, and choose an appointment schedule.</p>
    <x-email.button :url="$url">View Referral &amp; Schedule</x-email.button>
    <x-email.notice label="Privacy notice">This invitation contains referral details only. It does not contain medical findings or examination results.</x-email.notice>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:21px;">If you were not expecting this referral, please contact your company or the clinic.</p>
    <x-email.fallback-link :url="$url" />
</x-email.layout>
