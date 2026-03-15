<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Company Invitation - Living Myth Industrial Clinic</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7ff;">
    <div style="font-family: 'Helvetica', Arial, sans-serif; background-color: #f4f7ff; padding: 50px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05);">
            
            <!-- Header with Logo -->
            <div style="background: linear-gradient(to right, #246AFE, #1e58d4); padding: 40px; text-align: center;">
                <div style="margin-bottom: 20px;">
                    <img src="{{ config('app.url') }}/images/full_logo.png" 
                         alt="Living Myth Industrial Clinic" 
                         style="height: 80px; width: auto; display: inline-block; filter: drop-shadow(0px 0px 10px rgba(255,255,255,0.3));">
                </div>
                <h1 style="color: white; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
                    Partner Portal Invitation
                </h1>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px; text-align: center;">
                <h2 style="color: #111827; font-size: 22px; margin-bottom: 15px;">Hello, {{ $representativeName }}!</h2>
                <p style="color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 10px;">
                    <strong>Living Myth Industrial Clinic</strong> has invited your company, <strong>{{ $companyName }}</strong>, to access our Partner Portal.
                </p>

                <p style="color: #6b7280; line-height: 1.6; margin-bottom: 30px;">
                    You can now manage your company's employee medical appointments, view records, and schedule bulk bookings through our portal.
                </p>
                
                <!-- Credentials Box -->
                <div style="background-color: #f8faff; border: 1px solid #eef2ff; padding: 25px; border-radius: 16px; margin: 25px auto; display: block; max-width: 90%; text-align: left;">
                    <h3 style="color: #246AFE; font-size: 14px; text-transform: uppercase; margin-top: 0; margin-bottom: 15px; letter-spacing: 1px; font-weight: 800;">Your Login Credentials</h3>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="vertical-align: top; padding-bottom: 12px; width: 100px;">
                                <span style="font-size: 13px; color: #374151; font-weight: bold;">Email:</span>
                            </td>
                            <td style="padding-bottom: 12px; font-size: 13px; color: #4b5563;">
                                {{ $company->representative_email }}
                            </td>
                        </tr>
                        <tr>
                            <td style="vertical-align: top; padding-bottom: 12px;">
                                <span style="font-size: 13px; color: #374151; font-weight: bold;">Password:</span>
                            </td>
                            <td style="padding-bottom: 12px; font-size: 13px; color: #4b5563; font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">
                                {{ $tempPassword }}
                            </td>
                        </tr>
                    </table>
                </div>

                <p style="color: #9f1239; font-size: 14px; margin-bottom: 25px; font-weight: 500;">
                    ⚠️ Please change your password after first login for security purposes.
                </p>
                
                <a href="{{ url('/login') }}" style="display: inline-block; background-color: #246AFE; color: #ffffff; padding: 18px 40px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(36, 106, 254, 0.35); transition: background-color 0.3s ease;">
                    Login to Partner Portal
                </a>
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

