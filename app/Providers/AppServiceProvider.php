<?php

namespace App\Providers;

use App\Models\Appointment;
use App\Models\MedicalCertificate;
use App\Models\User;
use App\Security\LoginRateLimiter;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\Response as AccessResponse;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
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

        Appointment::observe(\App\Observers\AppointmentWorkflowObserver::class);
        \App\Models\Company::observe(\App\Observers\CompanyAccountNotificationObserver::class);
        \App\Models\CompanyReferral::observe(\App\Observers\CompanyReferralWorkflowObserver::class);
        \App\Models\DoctorAvailabilityChangeRequest::observe(\App\Observers\DoctorAvailabilityWorkflowObserver::class);
        \App\Models\OnsiteServiceQueue::observe(\App\Observers\OnsiteQueueWorkflowObserver::class);
        \App\Models\OnsiteEventStaff::observe(\App\Observers\OnsiteStaffWorkflowObserver::class);
        \App\Models\SecurityAudit::observe(\App\Observers\StaffSecurityNotificationObserver::class);
        \App\Models\SecurityAudit::observe(\App\Observers\BulkReportNotificationObserver::class);
        MedicalCertificate::observe(\App\Observers\MedicalCertificateNotificationObserver::class);
        \App\Models\ClinicalFormAudit::observe(\App\Observers\ClinicalActivityNotificationObserver::class);
        \App\Models\MedicalDocumentAudit::observe(\App\Observers\MedicalDocumentActivityNotificationObserver::class);

        Gate::before(function (User $user, string $ability, array $arguments): ?AccessResponse {
            $clinicalAction = in_array($ability, [
                'updatePhysicalExam', 'updateLaboratory', 'updateXray',
                'verifyDiagnosticResults', 'finalizeMedicalEvaluation', 'releaseMedicalReport',
            ], true) || ($ability === 'issue' && ($arguments[0] ?? null) instanceof MedicalCertificate);

            if ($clinicalAction && in_array($user->role, ['doctor', 'medtech', 'radtech'], true)
                && ! $user->hasVerifiedProfessionalLicense()) {
                return AccessResponse::deny('An administrator must verify your professional license before you can conduct medical examinations or release clinical documents.');
            }

            return null;
        });

        Event::listen(Login::class, function (Login $event): void {
            // Serialize final authentication (including remember cookies) against
            // the same row used for failed attempts; do not trust a stale snapshot.
            $allowed = DB::transaction(function () use ($event): bool {
                $user = User::query()->whereKey($event->user->getAuthIdentifier())->lockForUpdate()->first();

                if (! $user || $user->isLoginLocked()) {
                    return false;
                }

                $user->forceFill(['failed_login_attempts' => 0])->save();

                return true;
            });

            if (! $allowed) {
                $guard = Auth::guard($event->guard);
                // Guard::login has already written session/cookie state. Remove it
                // before interrupting the login event, including recaller logins.
                $guard->setUser($event->user);
                $guard->logoutCurrentDevice();
                if (request()->hasSession()) {
                    request()->session()->forget(['login.id', 'login.remember']);
                    request()->session()->invalidate();
                    request()->session()->regenerateToken();
                }

                throw new HttpResponseException(request()->expectsJson()
                    ? response()->json(['message' => LoginRateLimiter::ACCOUNT_LOCK_MESSAGE], 422)
                    : redirect()->route('login')->withErrors(['email' => LoginRateLimiter::ACCOUNT_LOCK_MESSAGE]));
            }

            if (request()->hasSession()) {
                request()->session()->put(
                    'password_hash_'.$event->guard,
                    Auth::guard($event->guard)->hashPasswordForCookie((string) $event->user->getAuthPassword()),
                );
            }
        });

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
