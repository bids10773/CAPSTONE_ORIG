<x-email.layout title="Your Company Portal Is Ready" preheader="Your secure company portal account has been created." :logo-src="$message->embed(public_path('images/email-logo.png'))">
    <p style="margin:0 0 8px;color:#6b8f71;font-size:13px;line-height:20px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Partner portal</p>
    <h1 style="margin:0;color:#1f2937;font-size:27px;line-height:35px;font-weight:700;">Your Company Portal Is Ready</h1>
    <p style="margin:18px 0 0;color:#4b5563;font-size:15px;line-height:24px;">Hello {{ $representativeName }},</p>
    <p style="margin:10px 0 0;color:#4b5563;font-size:15px;line-height:24px;">An administrator created your Living Myth Industrial Clinic partner account. Use the temporary credentials below to sign in.</p>
    <x-email.credentials :email="$loginEmail" :password="$temporaryPassword" role="Company Partner" />
    <x-email.notice tone="warning">These credentials expire on {{ $expiresAt->timezone(config('app.timezone'))->format('F j, Y \a\t g:i A T') }}. You must create a new password immediately after your first sign-in.</x-email.notice>
    <x-email.button :url="$loginUrl">Login to Your Account</x-email.button>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:22px;">Never forward these credentials. If you were not expecting this account, contact the clinic administrator immediately.</p>
    <x-email.fallback-link :url="$loginUrl" />
</x-email.layout>
