<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PatientProfile;
use App\Models\SocialAccount;
use App\Models\User;
use App\Support\RoleDashboard;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class SocialAuthenticationController extends Controller
{
    private const PROVIDERS = ['google', 'facebook'];

    public function redirect(string $provider): RedirectResponse
    {
        abort_unless(in_array($provider, self::PROVIDERS, true), 404);

        return Socialite::driver($provider)
            ->scopes(['email'])
            ->redirect();
    }

    public function callback(Request $request, string $provider): RedirectResponse
    {
        abort_unless(in_array($provider, self::PROVIDERS, true), 404);

        if ($request->filled('error')) {
            return to_route('login')->with('error', ucfirst($provider).' sign-in was cancelled.');
        }

        try {
            $identity = Socialite::driver($provider)->user();
        } catch (Throwable $exception) {
            report($exception);

            return to_route('login')->with('error', 'Unable to sign in with '.ucfirst($provider).'. Please try again.');
        }

        $providerId = (string) $identity->getId();
        $email = Str::lower(trim((string) $identity->getEmail()));
        $verifiedEmail = $this->hasTrustedEmail($provider, $identity->user);

        $linked = SocialAccount::query()
            ->where('provider', $provider)
            ->where('provider_user_id', $providerId)
            ->with('user')
            ->first();

        if ($linked) {
            return $this->login($request, $linked->user);
        }

        if ($email === '') {
            $request->session()->put('social_registration', [
                'provider' => $provider,
                'provider_user_id' => $providerId,
                'name' => $identity->getName(),
            ]);

            return to_route('social.email.create');
        }

        $existing = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

        if ($existing && ! $verifiedEmail) {
            return to_route('login')->with('error', 'An account already uses that email. Sign in with your password before linking '.ucfirst($provider).'.');
        }

        try {
            $user = DB::transaction(function () use ($existing, $identity, $provider, $providerId, $email, $verifiedEmail): User {
                $user = $existing ?? $this->createPatient($identity->getName(), $email, $verifiedEmail);

                SocialAccount::create([
                    'user_id' => $user->id,
                    'provider' => $provider,
                    'provider_user_id' => $providerId,
                ]);

                return $user;
            });
        } catch (Throwable $exception) {
            report($exception);

            return to_route('login')->with('error', 'That social account could not be linked. Please sign in another way or contact support.');
        }

        if (! $existing) {
            event(new Registered($user));
        }

        return $this->login($request, $user);
    }

    public function createEmail(Request $request): Response|RedirectResponse
    {
        if (! $request->session()->has('social_registration')) {
            return to_route('login')->with('error', 'Your social sign-in session expired. Please try again.');
        }

        return Inertia::render('auth/social-email');
    }

    public function storeEmail(Request $request): RedirectResponse
    {
        $pending = $request->session()->get('social_registration');
        abort_unless(is_array($pending), 419);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
        ]);

        $user = DB::transaction(function () use ($pending, $validated): User {
            $user = $this->createPatient($pending['name'] ?? null, Str::lower($validated['email']), false);
            SocialAccount::create([
                'user_id' => $user->id,
                'provider' => $pending['provider'],
                'provider_user_id' => $pending['provider_user_id'],
            ]);

            return $user;
        });

        $request->session()->forget('social_registration');
        event(new Registered($user));
        Auth::login($user);
        $request->session()->regenerate();

        return to_route('verification.notice')->with('status', 'verification-link-sent');
    }

    private function createPatient(?string $name, string $email, bool $verified): User
    {
        $parts = preg_split('/\s+/', trim((string) $name), 2) ?: [];

        $user = User::create([
            'first_name' => $parts[0] ?? 'Patient',
            'last_name' => $parts[1] ?? '',
            'email' => $email,
            'password' => null,
            'role' => 'patient',
            'is_active' => true,
            'email_verified_at' => $verified ? now() : null,
        ]);

        PatientProfile::create(['user_id' => $user->id]);

        return $user;
    }

    private function hasTrustedEmail(string $provider, array $raw): bool
    {
        if ($provider === 'google') {
            return filter_var($raw['email_verified'] ?? $raw['verified_email'] ?? false, FILTER_VALIDATE_BOOL);
        }

        return false;
    }

    private function login(Request $request, User $user): RedirectResponse
    {
        if (! $user->isActive()) {
            return to_route('login')->with('error', 'Your account is currently unavailable. Please contact the administrator.');
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        if (! $user->hasVerifiedEmail()) {
            return to_route('verification.notice')->with('error', 'Please verify your email first.');
        }

        if ($user->role === 'patient' && ! $user->hasCompletePatientProfile()) {
            return to_route('patient-profile.complete');
        }

        return redirect(RoleDashboard::path($user->role));
    }
}
