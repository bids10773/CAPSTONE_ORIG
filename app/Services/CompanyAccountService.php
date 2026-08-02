<?php

namespace App\Services;

use App\Mail\CompanyInvitation;
use App\Models\Company;
use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class CompanyAccountService
{
    public function __construct(private StaffCredentialService $credentials) {}

    public function create(array $data, ?UploadedFile $logo, User $actor): Company
    {
        $temporaryPassword = $this->credentials->generateTemporaryPassword();

        return DB::transaction(function () use ($data, $logo, $actor, $temporaryPassword): Company {
            if ($logo) {
                $data['logo_path'] = $logo->store('company-logos', 'public');
            }

            $company = Company::create($data);
            $account = User::create([
                'first_name' => $company->company_name,
                'middle_name' => null,
                'last_name' => 'Account',
                'email' => $company->email,
                'contact' => $company->contact_number,
                'password' => Hash::make($temporaryPassword),
                'role' => 'company',
                'company_id' => $company->id,
                'is_active' => $company->status === 'active',
                'email_verified_at' => now(),
                'must_change_password' => true,
                'temporary_password_created_at' => now(),
                'temporary_password_expires_at' => now()->addHours(48),
            ]);

            Mail::to($company->email)->send(new CompanyInvitation($company, $temporaryPassword));
            SecurityAudit::create([
                'actor_id' => $actor->id,
                'target_user_id' => $account->id,
                'action' => 'company_account_created_credentials_sent',
                'status' => 'success',
            ]);

            return $company;
        });
    }

    public function update(Company $company, array $data, ?UploadedFile $logo): Company
    {
        return DB::transaction(function () use ($company, $data, $logo): Company {
            $removeLogo = (bool) ($data['remove_logo'] ?? false);
            unset($data['remove_logo']);

            if ($logo) {
                if ($company->logo_path) {
                    Storage::disk('public')->delete($company->logo_path);
                }
                $data['logo_path'] = $logo->store('company-logos', 'public');
            } elseif ($removeLogo && $company->logo_path) {
                Storage::disk('public')->delete($company->logo_path);
                $data['logo_path'] = null;
            }

            $company->update($data);
            $company->account()->update([
                'first_name' => $company->company_name,
                'email' => $company->email,
                'contact' => $company->contact_number,
                'is_active' => $company->status === 'active',
            ]);

            return $company->refresh();
        });
    }

    public function resendInvitation(Company $company, User $actor): void
    {
        $temporaryPassword = $this->credentials->generateTemporaryPassword();

        DB::transaction(function () use ($company, $actor, $temporaryPassword): void {
            $account = $company->account()->firstOrFail();
            $account->update([
                'password' => Hash::make($temporaryPassword),
                'must_change_password' => true,
                'temporary_password_created_at' => now(),
                'temporary_password_expires_at' => now()->addHours(48),
            ]);
            Mail::to($company->email)->send(new CompanyInvitation($company, $temporaryPassword));
            SecurityAudit::create([
                'actor_id' => $actor->id,
                'target_user_id' => $account->id,
                'action' => 'company_temporary_credentials_resent',
                'status' => 'success',
            ]);
        });
    }
}
