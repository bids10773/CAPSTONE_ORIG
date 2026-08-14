<x-email.layout title="Your Staff Account Is Ready" preheader="Your secure staff account has been created." :logo-src="$message->embed(public_path('images/email-logo.png'))" :system-name="$systemName">
    <p style="margin:0 0 8px;color:#6b8f71;font-size:13px;line-height:20px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Staff onboarding</p>
    <h1 style="margin:0;color:#1f2937;font-size:27px;line-height:35px;font-weight:700;">Welcome to the Team</h1>
    <p style="margin:18px 0 0;color:#4b5563;font-size:15px;line-height:24px;">Hello {{ $staffName }},</p>
    <p style="margin:10px 0 0;color:#4b5563;font-size:15px;line-height:24px;">An administrator created your {{ $systemName }} staff account. Use the temporary credentials below to sign in.</p>
    <x-email.credentials :email="$loginEmail" :password="$temporaryPassword" :role="$role" />
    <x-email.notice tone="warning">These credentials expire on {{ $expiresAt->timezone(config('app.timezone'))->format('F j, Y \a\t g:i A T') }}. You must create a new password immediately after your first sign-in.</x-email.notice>
    <x-email.button :url="$loginUrl">Login to Your Account</x-email.button>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:22px;">Keep these credentials private. If you were not expecting this account, contact your clinic administrator immediately.</p>
    <x-email.fallback-link :url="$loginUrl" />
</x-email.layout>
