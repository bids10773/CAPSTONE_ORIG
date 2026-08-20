<?php

namespace App\Providers;

use App\Models\Appointment;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

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
        $this->configureReceptionistPermissions();

        // 1. CUSTOM EMAIL VERIFICATION LOGIC
        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            return (new MailMessage)
                ->subject('Verify Your Email Address | Living Myth Industrial Clinic')
                ->view('email.custom-verify', [
                    'url' => $url,
                    'name' => $notifiable->name,
                    'expiresIn' => config('auth.verification.expire', 60),
                ]);
        });

        // 2. CUSTOM PASSWORD RESET LOGIC
        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            $url = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            return (new MailMessage)
                ->subject('Reset Your Password | Living Myth Industrial Clinic')
                ->view('email.custom-reset', [
                    'url' => $url,
                    'name' => $notifiable->name,
                    'expiresIn' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire'),
                ]);
        });
    }

    private function configureReceptionistPermissions(): void
    {
        foreach (['walkin.view', 'walkin.create', 'patient.search', 'patient.register'] as $permission) {
            Gate::define($permission, fn ($user): bool => $user->role === 'receptionist');
        }

        Gate::define(
            'walkin.update',
            fn ($user, Appointment $appointment): bool => $user->role === 'receptionist'
                && in_array($appointment->type, ['walk_in', 'individual', 'company_referral'], true)
                && $appointment->user?->role === 'patient'
                && $appointment->appointment_date->isToday(),
        );
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

    }
}
