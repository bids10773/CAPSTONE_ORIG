<!-- resources/views/emails/custom-verify.blade.php -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account - Living Myth Industrial Clinic</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7ff;">
    <div style="font-family: 'Helvetica', Arial, sans-serif; background-color: #f4f7ff; padding: 50px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05);">
            
            <!-- Header with Logo -->
            <div style="background: linear-gradient(to right, #246AFE, #1e58d4); padding: 40px; text-align: center;">
                <div style="margin-bottom: 20px;">
                    <!-- [Action] Using Laravel's $message->embed to ensure the logo shows in all email clients -->
                    <img src="{{ $message->embed(public_path('images/full_logo.png')) }}" 
                         alt="Living Myth Industrial Clinic" 
                         style="height: 80px; width: auto; display: inline-block; filter: drop-shadow(0px 0px 10px rgba(255,255,255,0.3));">
                </div>
                <h1 style="color: white; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
                    Online Registration
                </h1>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px; text-align: center;">
                <h2 style="color: #111827; font-size: 22px; margin-bottom: 15px;">Hello, {{ $name }}!</h2>
                <p style="color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 10px;">
                    Thank you for using <strong>Living Myth Industrial Clinic's</strong> Online Registration Form.
                </p>

                <!-- SECURITY ALERT BOX: 5-MINUTE EXPIRATION -->
                <div style="background-color: #fff1f2; border: 1px solid #fda4af; padding: 18px; border-radius: 16px; margin: 25px auto; display: block; max-width: 90%;">
                    <p style="color: #be123c; font-size: 14px; margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                        ⚠️ Security Notice
                    </p>
                    <p style="color: #9f1239; font-size: 14px; margin: 8px 0 0; line-height: 1.4; font-weight: 500;">
                        {{ $expire_message ?? 'For your security, this verification link will expire in 5 minutes.' }}
                    </p>
                </div>

                <p style="color: #6b7280; line-height: 1.6; margin-bottom: 30px;">
                    To complete your registration and secure your account, please click the button below:
                </p>
                
                <a href="{{ $url }}" style="display: inline-block; background-color: #246AFE; color: #ffffff; padding: 18px 40px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(36, 106, 254, 0.35); transition: background-color 0.3s ease;">
                    Verify My Email Address
                </a >
            </div>

            <!-- Clinic Information Section -->
            <div style="padding: 30px; background-color: #f8faff; margin: 0 40px 30px; border-radius: 20px; text-align: left; border: 1px solid #eef2ff;">
                <h3 style="color: #246AFE; font-size: 14px; text-transform: uppercase; margin-top: 0; margin-bottom: 15px; letter-spacing: 1px; font-weight: 800;">Clinic Details</h3>
                
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="vertical-align: top; padding-bottom: 12px; width: 85px;">
                            <span style="font-size: 13px; color: #374151; font-weight: bold;">📍 Address:</span>
                        </td>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #4b5563; padding-left: 10px;">
                            2/F, Serafin Business Center, National Highway, Cabuyao City, Laguna
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; padding-bottom: 12px;">
                            <span style="font-size: 13px; color: #374151; font-weight: bold;">📞 Contact:</span>
                        </td>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #4b5563; padding-left: 10px;">
                            +63 922 889 6850
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top;">
                            <span style="font-size: 13px; color: #374151; font-weight: bold;">⏰ Schedule:</span>
                        </td>
                        <td style="font-size: 13px; color: #4b5563; padding-left: 10px;">
                            Monday - Saturday: 8:00 AM - 5:00 PM<br>
                            <span style="font-size: 12px; color: #9ca3af; font-style: italic;">(Closed on Sundays & Public Holidays)</span>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Footer & Disclaimer -->
            <div style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #edf2f7;">
                <p style="font-size: 11px; color: #374151; font-weight: bold; margin-bottom: 15px; text-transform: uppercase;">
                    ** This electronic mail is system-generated. Please do not reply. **
                </p>
                <div style="text-align: justify; font-size: 10px; color: #9ca3af; line-height: 1.6; border-top: 1px solid #e5e7eb; margin-top: 15px; padding-top: 15px;">
                    <strong>Confidentiality Notice:</strong><br>
                    The contents of this email and any attachments are confidential and/or legally privileged and are intended solely for the addressee. 
                    Any use, reproduction, or dissemination of this transmission by persons or entities other than the intended recipient 
                    is strictly prohibited.
                </div>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 25px;">
                    © {{ date('Y') }} Living Myth Industrial Clinic. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
