<?php

namespace App\Http\Controllers;

use App\Models\SecurityAudit;
use App\Models\User;
use App\Services\StaffCredentialService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StaffController extends Controller
{
    /**
     * Display a listing of staff users.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $role = $request->get('role', '');
        $status = $request->get('status', '');

        $query = User::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('contact_number', 'like', "%{$search}%")
                    ->orWhere('license_no', 'like', "%{$search}%");
            });
        }

        if ($role) {
            $query->where('role', $role);
        }

        if (in_array($status, ['active', 'inactive'], true)) {
            $query->where('is_active', $status === 'active');
        }

        $staff = $query->whereIn('role', ['doctor', 'medtech', 'radtech', 'receptionist'])
            ->orderBy('created_at', 'desc')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return Inertia::render('admin/staff/index', [
            'staff' => $staff,
            'filters' => [
                'search' => $search,
                'role' => $role,
                'status' => $status,
            ],
            'roles' => User::getStaffRoles(),
        ]);
    }

    /**
     * Show the form for creating a new staff member.
     */
    public function create(): Response
    {
        return Inertia::render('admin/staff/create', [
            'roles' => User::getStaffRoles(),
        ]);
    }

    /**
     * Store a newly created staff member.
     */
    public function store(Request $request, StaffCredentialService $credentials): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'contact' => ['nullable', 'string', 'max:20'],
            'sex' => ['nullable', 'string', 'in:male,female'],
            'role' => ['required', 'string', 'in:doctor,medtech,radtech,receptionist'],
            'license_no' => ['nullable', 'string', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();
        $temporaryPassword = $credentials->generateTemporaryPassword();

        try {
            DB::transaction(function () use ($credentials, $data, $request, $temporaryPassword): void {
                $staff = User::create([
                    'first_name' => $data['first_name'],
                    'middle_name' => $data['middle_name'] ?? null,
                    'last_name' => $data['last_name'],
                    'email' => $data['email'],
                    'contact' => $data['contact'] ?? null,
                    'sex' => $data['sex'] ?? null,
                    'password' => Hash::make($temporaryPassword),
                    'role' => $data['role'],
                    'license_no' => $data['license_no'] ?? null,
                    'specialization' => $data['specialization'] ?? null,
                    'is_active' => true,
                    'email_verified_at' => now(),
                    'must_change_password' => true,
                    'temporary_password_created_at' => now(),
                    'temporary_password_expires_at' => now()->addHours(48),
                ]);

                $credentials->send($staff, $temporaryPassword);

                SecurityAudit::create([
                    'actor_id' => $request->user()->id,
                    'target_user_id' => $staff->id,
                    'action' => 'staff_account_created_credentials_sent',
                    'status' => 'success',
                ]);
            });
        } catch (Throwable) {
            SecurityAudit::create([
                'actor_id' => $request->user()->id,
                'action' => 'staff_account_creation_failed',
                'status' => 'failure',
                'metadata' => ['email' => $data['email']],
            ]);

            return back()
                ->withInput()
                ->with('error', 'The account was not created because the credentials email could not be sent. Please verify the email service and try again.');
        }

        return redirect()->route('admin.staff.index')
            ->with('success', 'Staff account created successfully. Temporary login credentials were sent to the staff member’s email.');
    }

    public function resendCredentials(
        Request $request,
        User $staff,
        StaffCredentialService $credentials,
    ): RedirectResponse {
        abort_unless(in_array($staff->role, array_keys(User::getStaffRoles()), true), 404);

        if (! $staff->must_change_password) {
            return back()->with('error', 'Temporary credentials can only be resent before the staff member completes their first password change.');
        }

        $temporaryPassword = $credentials->generateTemporaryPassword();

        try {
            DB::transaction(function () use ($credentials, $request, $staff, $temporaryPassword): void {
                $staff->update([
                    'password' => Hash::make($temporaryPassword),
                    'must_change_password' => true,
                    'temporary_password_created_at' => now(),
                    'temporary_password_expires_at' => now()->addHours(48),
                ]);

                $credentials->send($staff, $temporaryPassword);

                SecurityAudit::create([
                    'actor_id' => $request->user()->id,
                    'target_user_id' => $staff->id,
                    'action' => 'staff_temporary_credentials_resent',
                    'status' => 'success',
                ]);
            });
        } catch (Throwable) {
            SecurityAudit::create([
                'actor_id' => $request->user()->id,
                'target_user_id' => $staff->id,
                'action' => 'staff_temporary_credentials_resend_failed',
                'status' => 'failure',
            ]);

            return back()->with('error', 'Credentials were not changed because the email could not be sent.');
        }

        return back()->with('success', 'New temporary credentials were sent successfully. The previous temporary password is no longer valid.');
    }

    /**
     * Show the form for editing the specified staff member.
     */
    public function edit(User $staff): Response
    {
        return Inertia::render('admin/staff/edit', [
            'staff' => $staff,
            'roles' => User::getStaffRoles(),
        ]);
    }

    /**
     * Update the specified staff member.
     */
    public function update(Request $request, User $staff)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$staff->id],
            'contact' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string', 'in:doctor,medtech,radtech,receptionist'],
            'license_no' => ['nullable', 'string', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'is_active' => ['boolean'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();

        // Update user data
        $staff->update([
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'contact' => $data['contact'] ?? null,
            'role' => $data['role'],
            'license_no' => $data['license_no'] ?? null,
            'specialization' => $data['specialization'] ?? null,
            'is_active' => $data['is_active'] ?? $staff->is_active,
        ]);

        // Update password if provided
        if (! empty($data['password'])) {
            $staff->update([
                'password' => Hash::make($data['password']),
            ]);
        }

        // Update role
        $staff->update(['role' => $data['role']]);

        return redirect()->route('admin.staff.index')
            ->with('success', "{$staff->name} has been updated successfully.");
    }

    /**
     * Remove the specified staff member.
     */
    public function destroy(User $staff)
    {
        // Prevent deleting own account
        if ($staff->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        return back()->with('error', 'Staff records cannot be permanently deleted because they may be linked to clinical history. Deactivate the account instead.');
    }

    /**
     * Toggle staff member active status.
     */
    public function toggleActive(User $staff)
    {
        if ($staff->id === auth()->id()) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        $staff->update([
            'is_active' => ! $staff->is_active,
        ]);

        $status = $staff->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "{$staff->name} has been {$status}.");
    }

    /**
     * Upload signature for staff member.
     */
    public function uploadSignature(Request $request, User $staff)
    {
        $validator = Validator::make($request->all(), [
            'signature' => ['required', 'image', 'mimes:png', 'max:2048'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        $path = $request->file('signature')->store('signatures', 'public');

        $staff->update([
            'signature_path' => $path,
        ]);

        return back()->with('success', 'Signature uploaded successfully.');
    }
}
