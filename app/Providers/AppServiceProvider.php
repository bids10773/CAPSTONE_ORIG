<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        // 1. CUSTOM EMAIL VERIFICATION LOGIC
        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            $logoPath = public_path('images/full_logo.jpg'); 
            $logoData = file_exists($logoPath) ? base64_encode(file_get_contents($logoPath)) : '';

            return (new MailMessage)
                ->subject('Welcome to LMC Clinic - Verify Your Account')
                ->view('email.custom-verify', [
                    'url' => $url,
                    'name' => $notifiable->name,
                    'logo' => $logoData,
                    'expire_message' => 'For your security, this link is only valid for 5 minutes.',
                ]);
        });

        // 2. CUSTOM PASSWORD RESET LOGIC
        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            // Build the URL manually to ensure it includes the email
            $url = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            return (new MailMessage)
                ->subject('LMIC Company - Reset Your Password')
                // You can reuse a similar layout for the reset email
                ->view('email.custom-reset', [
                    'url' => $url,
                    'name' => $notifiable->name,
                    'expire_message' => 'This password reset link will expire in 60 minutes.',
                ]);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
