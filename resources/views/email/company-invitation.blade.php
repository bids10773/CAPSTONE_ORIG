<x-email.layout title="Company portal sign-in credentials" preheader="New temporary sign-in credentials are available for your company portal account." :logo-src="$message->embed(public_path('images/email-logo-optimized.png'))">
    <p style="margin:0 0 8px;color:#6b8f71;font-size:13px;line-height:20px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Partner portal</p>
    <h1 style="margin:0;color:#1f2937;font-size:27px;line-height:35px;font-weight:700;">Company portal sign-in credentials</h1>
    <p style="margin:18px 0 0;color:#4b5563;font-size:15px;line-height:24px;">Hello {{ $representativeName }},</p>
    <p style="margin:10px 0 0;color:#4b5563;font-size:15px;line-height:24px;">New temporary sign-in credentials for your {{ $companyName }} company portal account were generated{{ $actorSuffix }}. Use the credentials below to sign in.</p>
    <x-email.credentials :email="$loginEmail" :password="$temporaryPassword" role="Company Representative" />
    <x-email.notice tone="warning">These credentials expire on {{ $expiresAt->timezone(config('app.timezone'))->format('F j, Y \a\t g:i A T') }}. You must create a new password immediately after your first sign-in.</x-email.notice>
    <x-email.button :url="$loginUrl">Sign in to your account</x-email.button>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:22px;">Never forward these credentials. If you were not expecting these credentials, contact the clinic administrator immediately.</p>
    <x-email.fallback-link :url="$loginUrl" />
</x-email.layout>
