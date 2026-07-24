<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $profileData = collect($validated)->only(['birthdate', 'sex', 'civil_status'])->all();
        $userData = collect($validated)->except(['birthdate', 'sex', 'civil_status'])->all();

        DB::transaction(function () use ($user, $userData, $profileData) {
            $user->fill($userData);

            if ($user->isDirty('email')) {
                $user->email_verified_at = null;
            }

            $user->save();

            if ($user->role === 'patient' && ($user->patientProfile || ! empty($profileData['birthdate']))) {
                $user->patientProfile()->updateOrCreate(['user_id' => $user->id], $profileData);
            }
        });

        $emailChanged = array_key_exists('email', $user->getChanges());
        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return to_route('profile.edit')->with(
            'status',
            $emailChanged ? 'verification-link-sent' : 'profile-updated',
        );
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
