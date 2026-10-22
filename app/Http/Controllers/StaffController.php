<?php

namespace App\Http\Controllers;

use App\Models\SecurityAudit;
use App\Models\User;
use App\Services\StaffCredentialService;
use App\Support\SearchTerm;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
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
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:100']]);
        $search = SearchTerm::normalize((string) ($filters['search'] ?? ''));
        $likeSearch = SearchTerm::forLike($search);
        $role = (string) $request->get('role', '');
        $status = (string) $request->get('status', '');
        $onlineThreshold = now()->subMinutes(5)->timestamp;

        $latestSessions = DB::table(config('session.table', 'sessions'))
            ->whereNotNull('user_id')
            ->select('user_id')
            ->selectRaw('MAX(last_activity) as last_activity')
            ->groupBy('user_id');

        $query = User::query()
            ->leftJoinSub(
                $latestSessions,
                'staff_sessions',
                fn ($join) => $join->on('users.id', '=', 'staff_sessions.user_id'),
            )
            ->select('users.*')
            ->addSelect('staff_sessions.last_activity');

        if ($search) {
            $query->where(function ($q) use ($likeSearch) {
                $q->where('first_name', 'like', "%{$likeSearch}%")
                    ->orWhere('last_name', 'like', "%{$likeSearch}%")
                    ->orWhere('middle_name', 'like', "%{$likeSearch}%")
                    ->orWhere('email', 'like', "%{$likeSearch}%")
                    ->orWhere('contact', 'like', "%{$likeSearch}%")
                    ->orWhere('license_no', 'like', "%{$likeSearch}%");
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
            ->withQueryString()
            ->through(function (User $member) use ($onlineThreshold): User {
                $lastActivity = $member->getAttribute('last_activity');

                $member->setAttribute(
                    'is_online',
                    $lastActivity !== null && (int) $lastActivity >= $onlineThreshold,
                );
                $member->setAttribute(
                    'last_active_at',
                    $lastActivity !== null
                        ? Carbon::createFromTimestamp((int) $lastActivity)->toIso8601String()
                        : null,
                );
                unset($member->last_activity);

                return $member;
            });

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
        abort_unless(in_array($staff->role, array_keys(User::getStaffRoles()), true), 404);

        return Inertia::render('admin/staff/edit', [
            'staff' => [
                ...$staff->toArray(),
                'has_license_document_front' => filled($staff->license_document_path)
                    && Storage::disk('local')->exists($staff->license_document_path),
                'has_license_document_back' => filled($staff->license_document_back_path)
                    && Storage::disk('local')->exists($staff->license_document_back_path),
            ],
            'roles' => User::getStaffRoles(),
            'canChangeRole' => ! $this->hasRecordedActivity($staff),
        ]);
    }

    /**
     * Update the specified staff member.
     */
    public function update(Request $request, User $staff)
    {
        abort_unless(in_array($staff->role, array_keys(User::getStaffRoles()), true), 404);

        $validator = Validator::make($request->all(), [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$staff->id],
            'contact' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string', 'in:doctor,medtech,radtech,receptionist'],
            'license_no' => ['nullable', 'regex:/^\d{5,7}$/'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();

        if ($data['role'] !== $staff->role && $this->hasRecordedActivity($staff)) {
            return back()
                ->withErrors(['role' => 'The role cannot be changed because this staff member is linked to clinical or operational records.'])
                ->withInput();
        }

        $licenseNo = in_array($data['role'], ['doctor', 'medtech', 'radtech'], true)
            && filled($data['license_no'] ?? null)
                ? trim($data['license_no'])
                : null;
        $credentialChanged = $licenseNo !== $staff->license_no || $data['role'] !== $staff->role;
        $oldLicenseDocuments = $credentialChanged
            ? array_filter([$staff->license_document_path, $staff->license_document_back_path])
            : [];
        $updates = [
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'contact' => $data['contact'] ?? null,
            'role' => $data['role'],
            'license_no' => $licenseNo,
            'specialization' => $data['specialization'] ?? null,
            'is_active' => $data['is_active'] ?? $staff->is_active,
        ];
        if ($credentialChanged) {
            $updates = [
                ...$updates,
                'license_verification_status' => 'not_submitted',
                'license_document_path' => null,
                'license_document_back_path' => null,
                'license_verified_at' => null,
                'license_verified_by' => null,
                'license_rejection_reason' => null,
            ];
        }
        $changes = [];

        foreach ($updates as $field => $value) {
            if ($staff->getAttribute($field) !== $value) {
                $changes[$field] = [
                    'from' => $staff->getAttribute($field),
                    'to' => $value,
                ];
            }
        }

        DB::transaction(function () use ($changes, $request, $staff, $updates): void {
            $staff->update($updates);

            if ($changes !== []) {
                SecurityAudit::create([
                    'actor_id' => $request->user()->id,
                    'target_user_id' => $staff->id,
                    'action' => 'staff_account_updated',
                    'status' => 'success',
                    'metadata' => ['changes' => $changes],
                ]);
            }
        });

        if ($oldLicenseDocuments !== []) {
            Storage::disk('local')->delete(array_values($oldLicenseDocuments));
        }

        return redirect()->route('admin.staff.index')
            ->with('success', "{$staff->name} has been updated successfully.");
    }

    /**
     * Remove the specified staff member.
     */
    public function destroy(User $staff)
    {
        abort_unless(in_array($staff->role, array_keys(User::getStaffRoles()), true), 404);

        // Prevent deleting own account
        if ($staff->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $name = $staff->name;

        try {
            DB::transaction(function () use ($staff): void {
                SecurityAudit::create([
                    'actor_id' => auth()->id(),
                    'target_user_id' => $staff->id,
                    'action' => 'staff_account_deleted',
                    'status' => 'success',
                    'metadata' => [
                        'name' => $staff->name,
                        'email' => $staff->email,
                        'role' => $staff->role,
                    ],
                ]);

                $staff->delete();
            });
        } catch (QueryException) {
            return back()->with('error', 'This staff account cannot be deleted because it is linked to clinical history. Deactivate the account instead.');
        }

        return redirect()->route('admin.staff.index')
            ->with('success', "{$name}'s staff account has been deleted.");
    }

    /**
     * Toggle staff member active status.
     */
    public function toggleActive(User $staff)
    {
        abort_unless(in_array($staff->role, array_keys(User::getStaffRoles()), true), 404);

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

    public function downloadLicenseDocument(User $staff, string $side = 'front')
    {
        $this->ensureClinicalStaff($staff);
        $path = $side === 'back'
            ? $staff->license_document_back_path
            : $staff->license_document_path;
        abort_unless(
            filled($path) && Storage::disk('local')->exists($path),
            404,
        );

        $extension = pathinfo($path, PATHINFO_EXTENSION);

        return Storage::disk('local')->download(
            $path,
            "prc-id-{$side}".($extension ? ".{$extension}" : ''),
        );
    }

    public function updateLicenseVerification(Request $request, User $staff): RedirectResponse
    {
        $this->ensureClinicalStaff($staff);
        abort_unless(
            filled($staff->license_no)
                && filled($staff->license_document_path)
                && filled($staff->license_document_back_path)
                && Storage::disk('local')->exists($staff->license_document_path)
                && Storage::disk('local')->exists($staff->license_document_back_path),
            422,
        );

        $validated = $request->validate([
            'status' => ['required', 'in:verified,rejected'],
            'rejection_reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:1000'],
        ]);

        $verified = $validated['status'] === 'verified';

        DB::transaction(function () use ($request, $staff, $validated, $verified): void {
            $staff->update([
                'license_verification_status' => $validated['status'],
                'license_verified_at' => $verified ? now() : null,
                'license_verified_by' => $verified ? $request->user()->id : null,
                'license_rejection_reason' => $verified ? null : $validated['rejection_reason'],
            ]);

            SecurityAudit::create([
                'actor_id' => $request->user()->id,
                'target_user_id' => $staff->id,
                'action' => $verified ? 'professional_license_verified' : 'professional_license_rejected',
                'status' => 'success',
                'metadata' => $verified ? null : ['reason' => $validated['rejection_reason']],
            ]);
        });

        return back()->with('success', $verified
            ? 'The professional license has been verified.'
            : 'The professional license submission has been rejected.');
    }

    private function ensureClinicalStaff(User $staff): void
    {
        abort_unless(in_array($staff->role, ['doctor', 'medtech', 'radtech'], true), 404);
    }

    private function hasRecordedActivity(User $staff): bool
    {
        $references = [
            'appointments' => ['doctor_id', 'checked_in_by', 'processed_by', 'attendance_marked_by'],
            'physical_exams' => ['doctor_id', 'finalized_by', 'verified_by'],
            'lab_results' => ['encoded_by', 'verified_by', 'finalized_by'],
            'xray_reports' => ['radiologist_id', 'verified_by', 'finalized_by'],
            'medical_examinations' => ['examining_doctor_id', 'finalized_by', 'released_by'],
            'diagnostic_results' => ['performed_by', 'encoded_by', 'verified_by'],
            'clinical_form_audits' => ['actor_id'],
            'onsite_event_staff' => ['user_id'],
            'onsite_service_queues' => ['assigned_staff_id'],
            'bulk_medical_reports' => ['generated_by', 'released_by'],
            'inquiries' => ['responded_by'],
        ];

        foreach ($references as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $availableColumns = array_values(array_filter(
                $columns,
                fn (string $column): bool => Schema::hasColumn($table, $column),
            ));

            if ($availableColumns === []) {
                continue;
            }

            $hasReference = DB::table($table)
                ->where(function ($query) use ($availableColumns, $staff): void {
                    foreach ($availableColumns as $index => $column) {
                        $index === 0
                            ? $query->where($column, $staff->id)
                            : $query->orWhere($column, $staff->id);
                    }
                })
                ->exists();

            if ($hasReference) {
                return true;
            }
        }

        return false;
    }
}
