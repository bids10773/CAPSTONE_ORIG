<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\SecurityAudit;
use App\Services\PatientMedicalProfileService;
use App\Support\PhilippineContactNumber;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request, PatientMedicalProfileService $medicalProfile): Response
    {
        $user = $request->user();

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'twoFactorAvailable' => Features::enabled(Features::twoFactorAuthentication()),
            'twoFactorEnabled' => $request->user()->hasEnabledTwoFactorAuthentication(),
            'requiresTwoFactorConfirmation' => Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm'),
            'canManageTwoFactor' => now()->timestamp - (int) $request->session()->get('auth.password_confirmed_at', 0) <= (int) config('auth.password_timeout', 10800),
            'medicalRecords' => $user->role === 'patient'
                ? $medicalProfile->recordsFor($user, releasedOnly: true)
                : [],
        ]);
    }

    public function confirmTwoFactor(): RedirectResponse
    {
        return to_route('profile.edit');
    }

    /**
     * Store the authenticated clinician's electronic signature.
     */
    public function updateSignature(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'signature' => ['required', 'image', 'mimes:png', 'max:2048'],
        ]);
        $user = $request->user();
        abort_unless(in_array($user->role, ['doctor', 'medtech', 'radtech'], true), 403);

        $oldPath = $user->signature_path;
        $path = $validated['signature']->store('signatures', 'public');
        $user->update(['signature_path' => $path]);

        if ($oldPath && $oldPath !== $path) {
            Storage::disk('public')->delete($oldPath);
        }

        SecurityAudit::create([
            'actor_id' => $user->id,
            'target_user_id' => $user->id,
            'action' => 'electronic_signature_updated',
            'status' => 'success',
            'metadata' => ['ip_address' => $request->ip()],
        ]);

        return to_route('profile.edit')->with('success', 'Electronic signature updated successfully.');
    }

    /**
     * Store professional-license evidence on the private filesystem for admin review.
     */
    public function updateLicenseDocument(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['doctor', 'medtech', 'radtech'], true), 403);

        if (! filled($user->license_no)) {
            return back()->withErrors([
                'license_document_front' => 'Add your PRC license number before submitting your ID.',
            ]);
        }

        $validated = $request->validate([
            'license_document_front' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:5120'],
            'license_document_back' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:5120'],
        ]);

        $oldPaths = array_filter([
            $user->license_document_path,
            $user->license_document_back_path,
        ]);
        $frontPath = $validated['license_document_front']->store("license-documents/{$user->id}", 'local');
        $backPath = $validated['license_document_back']->store("license-documents/{$user->id}", 'local');

        DB::transaction(function () use ($backPath, $frontPath, $request, $user): void {
            $user->update([
                'license_document_path' => $frontPath,
                'license_document_back_path' => $backPath,
                'license_verification_status' => 'pending',
                'license_verified_at' => null,
                'license_verified_by' => null,
                'license_rejection_reason' => null,
            ]);

            SecurityAudit::create([
                'actor_id' => $user->id,
                'target_user_id' => $user->id,
                'action' => 'professional_license_submitted',
                'status' => 'success',
                'metadata' => [
                    'license_no' => $user->license_no,
                    'front_original_filename' => $request->file('license_document_front')->getClientOriginalName(),
                    'back_original_filename' => $request->file('license_document_back')->getClientOriginalName(),
                    'ip_address' => $request->ip(),
                ],
            ]);
        });

        Storage::disk('local')->delete(array_values(array_diff($oldPaths, [$frontPath, $backPath])));

        return to_route('profile.edit')->with('success', 'The front and back of your PRC ID were submitted for administrator review.');
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $profileFields = ['birthdate', 'sex', 'civil_status', 'address'];
        $profileData = collect($validated)->only($profileFields)->all();
        $userData = collect($validated)->except($profileFields)->all();
        if ($user->role === 'company') {
            unset($userData['email'], $userData['contact']);
        }
        if (array_key_exists('contact', $userData)) {
            $userData['contact'] = PhilippineContactNumber::normalize($userData['contact']) ?? $userData['contact'];
        }

        if (array_key_exists('license_no', $userData)) {
            $userData['license_no'] = filled($userData['license_no']) ? trim($userData['license_no']) : null;
        }

        $licenseChanged = array_key_exists('license_no', $userData)
            && $userData['license_no'] !== $user->license_no;
        $oldLicenseDocuments = $licenseChanged
            ? array_filter([$user->license_document_path, $user->license_document_back_path])
            : [];

        if ($licenseChanged) {
            $userData = [
                ...$userData,
                'license_verification_status' => 'not_submitted',
                'license_document_path' => null,
                'license_document_back_path' => null,
                'license_verified_at' => null,
                'license_verified_by' => null,
                'license_rejection_reason' => null,
            ];
        }

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

        if ($oldLicenseDocuments !== []) {
            Storage::disk('local')->delete(array_values($oldLicenseDocuments));
        }

        if ($licenseChanged) {
            SecurityAudit::create([
                'actor_id' => $user->id,
                'target_user_id' => $user->id,
                'action' => 'professional_license_changed',
                'status' => 'success',
                'metadata' => ['ip_address' => $request->ip()],
            ]);
        }

        $emailChanged = array_key_exists('email', $user->getChanges());
        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return to_route('profile.edit')->with([
            'status' => $emailChanged ? 'verification-link-sent' : 'profile-updated',
            'success' => $emailChanged
                ? 'Profile updated. Please verify your new email address.'
                : 'Profile updated successfully.',
        ]);
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
