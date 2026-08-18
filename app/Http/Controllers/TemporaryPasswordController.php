<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use App\Models\SecurityAudit;
use App\Notifications\PasswordChanged;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TemporaryPasswordController extends Controller
{
    use PasswordValidationRules;

    public function edit(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->must_change_password) {
            return redirect($this->dashboardFor($request->user()->role));
        }

        return Inertia::render('auth/change-temporary-password');
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->must_change_password) {
            return redirect($this->dashboardFor($user->role));
        }

        if ($user->temporary_password_expires_at?->isPast()) {
            throw ValidationException::withMessages([
                'current_password' => 'This temporary password has expired. Ask an administrator to resend your credentials.',
            ]);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password:web'],
            'password' => [...$this->passwordRules(), 'different:current_password'],
        ], $this->passwordValidationMessages());

        $user->update([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
            'temporary_password_created_at' => null,
            'temporary_password_expires_at' => null,
        ]);

        $request->session()->regenerate();

        SecurityAudit::create([
            'actor_id' => $user->id,
            'target_user_id' => $user->id,
            'action' => 'temporary_password_changed',
            'status' => 'success',
        ]);

        $user->notify(new PasswordChanged);

        return redirect($this->dashboardFor($user->role))
            ->with('success', 'Your password has been changed successfully.');
    }

    private function dashboardFor(string $role): string
    {
        return match ($role) {
            'admin' => '/admin/dashboard',
            'doctor' => '/doctor/dashboard',
            'medtech' => '/medtech/dashboard',
            'radtech' => '/radtech/dashboard',
            'company' => '/company/dashboard',
            'receptionist' => '/receptionist/dashboard',
            default => '/dashboard',
        };
    }
}
