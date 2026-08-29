<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\CustomLoginResponse;
use App\Actions\Fortify\NormalizeLoginEmail;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Responses\LoginLockoutResponse;
use App\Models\SecurityAudit;
use App\Security\LoginRateLimiter as ApplicationLoginRateLimiter;
use App\Support\RoleDashboard;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Actions\AttemptToAuthenticate;
use Laravel\Fortify\Actions\CanonicalizeUsername;
use Laravel\Fortify\Actions\EnsureLoginIsNotThrottled;
use Laravel\Fortify\Actions\PrepareAuthenticatedSession;
use Laravel\Fortify\Contracts\LockoutResponse;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\RedirectsIfTwoFactorAuthenticatable;
use Laravel\Fortify\Contracts\VerifyEmailResponse;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\LoginRateLimiter;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LoginResponse::class, CustomLoginResponse::class);
        $this->app->singleton(LockoutResponse::class, LoginLockoutResponse::class);
        $this->app->singleton(LoginRateLimiter::class, ApplicationLoginRateLimiter::class);
        $this->app->singleton(VerifyEmailResponse::class, fn () => new class implements VerifyEmailResponse
        {
            public function toResponse($request)
            {
                return redirect()->intended(RoleDashboard::path($request->user()->role).'?verified=1')
                    ->with('status', 'email-verified');
            }
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configure Inertia views for authentication
        $this->configureViews();

        // Configure Fortify actions (user creation, password reset, etc.)
        $this->configureActions();

        // Keep Fortify's authentication pipeline while applying the
        // application's validation and account-status requirements.
        $this->configureAuthentication();

        Fortify::authenticateThrough(fn () => array_filter([
            NormalizeLoginEmail::class,
            EnsureLoginIsNotThrottled::class,
            config('fortify.lowercase_usernames') ? CanonicalizeUsername::class : null,
            Features::enabled(Features::twoFactorAuthentication()) ? RedirectsIfTwoFactorAuthenticatable::class : null,
            AttemptToAuthenticate::class,
            PrepareAuthenticatedSession::class,
        ]));

        // Configure rate limiting
        $this->configureRateLimiting();

        // Redirect to email verification after registration
        Fortify::redirects('register', '/email/verify');
        config(['fortify.redirects.logout' => '/login']);
    }

    private function configureAuthentication(): void
    {
        Fortify::authenticateUsing(function (Request $request) {
            $request->merge([
                'email' => Str::lower(trim((string) $request->input('email'))),
            ]);

            Validator::make($request->only('email', 'password'), [
                'email' => ['required', 'string', 'email:rfc', 'max:255'],
                'password' => ['required', 'string'],
            ], [
                'email.required' => 'Email address is required.',
                'email.email' => 'Please enter a valid email address.',
                'password.required' => 'Password is required.',
            ])->validate();

            $credentials = $request->only('email', 'password');
            $provider = Auth::guard('web')->getProvider();
            $user = $provider->retrieveByCredentials($credentials);

            if (! $user || ! $provider->validateCredentials($user, $credentials)) {
                return null;
            }

            if (! $user->isActive()) {
                SecurityAudit::create([
                    'target_user_id' => $user->getAuthIdentifier(),
                    'action' => 'inactive_account_login_attempt',
                    'status' => 'blocked',
                    'metadata' => ['ip' => $request->ip()],
                ]);

                throw ValidationException::withMessages([
                    'email' => 'Your account is currently unavailable. Please contact the administrator.',
                ]);
            }

            return $user;
        });
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'email' => old('email'),
            'loginAttemptLimit' => $request->session()->get('login_attempt_limit'),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('appointment-booking', function (Request $request) {
            return Limit::perMinute((int) config('medical.booking_security.booking_attempts_per_minute', 5))
                ->by(($request->user()?->id ?? 'guest').'|'.$request->ip())
                ->response(fn () => back()->withErrors([
                    'appointment_limit' => 'Too many booking attempts. Please try again shortly.',
                ]));
        });

        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

    }
}
