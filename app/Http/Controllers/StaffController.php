<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;


class StaffController extends Controller
{
    /**
     * Display a listing of staff users.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $role = $request->get('role', '');

        $query = User::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role) {
            $query->where('role', $role);
        }

$staff = $query->whereIn('role', ['doctor', 'medtech', 'radtech', 'receptionist'])
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();


        return Inertia::render('admin/staff/index', [
            'staff' => $staff,
            'filters' => [
                'search' => $search,
                'role' => $role,
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
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'contact' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string', 'in:doctor,medtech,radtech,receptionist'],
            'license_no' => ['nullable', 'string', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);


        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();

        // Create the user
        $user = User::create([
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'contact' => $data['contact'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'license_no' => $data['license_no'] ?? null,
            'specialization' => $data['specialization'] ?? null,
            'is_active' => true,
            'email_verified_at' => now(), // Admin-created accounts are automatically verified
        ]);

        $user->markEmailAsVerified();
        $user->update(['role' => $data['role']]);

        return redirect()->route('admin.staff.index')
            ->with('success', "{$user->name} has been created successfully.");
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
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $staff->id],
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
        if (!empty($data['password'])) {
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

        $staff->delete();

        return redirect()->route('admin.staff.index')
            ->with('success', 'Staff member has been deleted successfully.');
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
            'is_active' => !$staff->is_active,
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

