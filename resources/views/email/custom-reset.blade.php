<!-- resources/views/emails/custom-reset.blade.php -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Living Myth Industrial Clinic</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7ff;">
    <div style="font-family: 'Helvetica', Arial, sans-serif; background-color: #f4f7ff; padding: 50px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <div style="background: linear-gradient(to right, #246AFE, #1e58d4); padding: 40px; text-align: center;">
                <div style="margin-bottom: 20px;">
                    <img src="{{ $message->embed(public_path('images/full_logo.png')) }}" 
                         alt="Living Myth Industrial Clinic" 
                         style="height: 80px; width: auto; display: inline-block;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
                    Password Reset Request
                </h1>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px; text-align: center;">
                <h2 style="color: #111827; font-size: 22px; margin-bottom: 15px;">Hello, {{ $name }}!</h2>
                <p style="color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 10px;">
                    You are receiving this email because we received a password reset request for your account at <strong>Living Myth Industrial Clinic</strong>.
                </p>

                <!-- SECURITY ALERT BOX -->
                <div style="background-color: #fffbeb; border: 1px solid #fcd34d; padding: 18px; border-radius: 16px; margin: 25px auto; display: block; max-width: 90%;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                        ⚠️ Security Notice
                    </p>
                    <p style="color: #b45309; font-size: 14px; margin: 8px 0 0; line-height: 1.4; font-weight: 500;">
                        {{ $expire_message ?? 'This password reset link will expire in 60 minutes.' }}
                    </p>
                </div>

                <p style="color: #6b7280; line-height: 1.6; margin-bottom: 30px;">
                    If you did not request a password reset, no further action is required. To reset your password, click the button below:
                </p>
                
                <a href="{{ $url }}" style="display: inline-block; background-color: #246AFE; color: #ffffff; padding: 18px 40px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(36, 106, 254, 0.35);">
                    Reset Password
                </a>
            </div>

            <!-- Footer -->
            <div style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #edf2f7;">
                <p style="font-size: 11px; color: #9ca3af; line-height: 1.6;">
                    © {{ date('Y') }} Living Myth Industrial Clinic. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
