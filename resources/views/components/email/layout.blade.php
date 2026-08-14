@props([
    'title',
    'preheader' => '',
    'logoSrc',
    'systemName' => 'Living Myth Industrial Clinic',
])
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>{{ $title }}</title>
    <style>
        @media only screen and (max-width: 620px) {
            .email-shell { padding: 16px 10px !important; }
            .email-card { border-radius: 14px !important; }
            .email-header { padding: 24px 20px !important; }
            .email-content { padding: 28px 22px !important; }
            .email-footer { padding: 22px !important; }
            .email-button { display: block !important; text-align: center !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f3f7f2;color:#1f2937;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{{ $preheader }}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f3f7f2;">
    <tr>
        <td class="email-shell" align="center" style="padding:32px 16px;">
            <table class="email-card" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #dfe8df;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(48,63,52,0.08);">
                <tr>
                    <td class="email-header" align="center" style="padding:28px 32px;background-color:#56765c;">
                        <img src="{{ $logoSrc }}" width="120" alt="{{ $systemName }} logo" style="display:block;width:120px;max-width:100%;height:auto;margin:0 auto;border:0;">
                        <p style="margin:12px 0 0;color:#ffffff;font-size:13px;line-height:20px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">{{ $systemName }}</p>
                    </td>
                </tr>
                <tr>
                    <td class="email-content" style="padding:38px 40px;">
                        {{ $slot }}
                    </td>
                </tr>
                <tr>
                    <td class="email-footer" align="center" style="padding:24px 32px;background-color:#f8faf8;border-top:1px solid #e3e9e3;">
                        <p style="margin:0;color:#455e4a;font-size:12px;line-height:19px;font-weight:700;">{{ $systemName }}</p>
                        <p style="margin:7px 0 0;color:#6b7280;font-size:12px;line-height:19px;">Your privacy and account security are important to us.</p>
                        <p style="margin:7px 0 0;color:#6b7280;font-size:12px;line-height:19px;">This is an automated message. Please do not reply to this email.</p>
                        <p style="margin:14px 0 0;color:#9ca3af;font-size:11px;line-height:17px;">&copy; {{ date('Y') }} {{ $systemName }}. All rights reserved.</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
