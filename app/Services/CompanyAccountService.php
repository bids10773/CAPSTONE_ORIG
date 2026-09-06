<?php

namespace App\Services;

use App\Mail\CompanyInvitation;
use App\Models\Company;
use App\Models\Inquiry;
use App\Models\SecurityAudit;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Throwable;

class CompanyAccountService
{
    public function __construct(private StaffCredentialService $credentials) {}

    public function create(array $data, ?UploadedFile $logo, User $actor): Company
    {
        $temporaryPassword = $this->credentials->generateTemporaryPassword();
        $representative = $this->representativeData($data);
        $sourceInquiryId = Arr::pull($data, 'source_inquiry_id');
        $companyData = Arr::except($data, $this->representativeKeys());
        $storedLogoPath = null;

        try {
            return DB::transaction(function () use ($companyData, $representative, $sourceInquiryId, $logo, $actor, $temporaryPassword, &$storedLogoPath): Company {
                if ($logo) {
                    $storedLogoPath = $logo->store('company-logos', 'public');
                    $companyData['logo_path'] = $storedLogoPath;
                }

                $company = Company::create([...$companyData, 'is_partnered' => true]);
                $account = User::create([
                    ...$representative,
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

                if ($sourceInquiryId) {
                    $inquiry = Inquiry::query()->lockForUpdate()->findOrFail($sourceInquiryId);
                    if ($inquiry->category !== \App\Enums\InquiryCategory::CompanyAccount || $inquiry->converted_company_id !== null) {
                        throw new \InvalidArgumentException('The source inquiry cannot be converted to a company account.');
                    }
                    $inquiry->update([
                        'converted_company_id' => $company->id,
                        'status' => \App\Enums\InquiryStatus::Closed,
                    ]);
                }

                SecurityAudit::create([
                    'actor_id' => $actor->id,
                    'target_user_id' => $account->id,
                    'action' => 'company_account_created_credentials_sent',
                    'status' => 'success',
                    'metadata' => $sourceInquiryId ? ['source_inquiry_id' => $sourceInquiryId] : null,
                ]);

                Mail::to($company->email)->send(new CompanyInvitation($company, $account, $temporaryPassword));

                return $company;
            });
        } catch (Throwable $exception) {
            if ($storedLogoPath) {
                Storage::disk('public')->delete($storedLogoPath);
            }

            throw $exception;
        }
    }

    public function update(Company $company, array $data, ?UploadedFile $logo): Company
    {
        return DB::transaction(function () use ($company, $data, $logo): Company {
            $representative = $this->representativeData($data, false);
            $removeLogo = (bool) ($data['remove_logo'] ?? false);
            $data = Arr::except($data, [...$this->representativeKeys(), 'remove_logo', 'source_inquiry_id']);

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
            $accountChanges = $representative;
            if (array_key_exists('email', $data)) {
                $accountChanges['email'] = $company->email;
            }
            if (array_key_exists('contact_number', $data)) {
                $accountChanges['contact'] = $company->contact_number;
            }
            if (array_key_exists('status', $data)) {
                $accountChanges['is_active'] = $company->status === 'active';
            }
            if ($accountChanges !== []) {
                $company->account()->update($accountChanges);
            }

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
            SecurityAudit::create([
                'actor_id' => $actor->id,
                'target_user_id' => $account->id,
                'action' => 'company_temporary_credentials_resent',
                'status' => 'success',
            ]);
            Mail::to($company->email)->send(new CompanyInvitation($company, $account, $temporaryPassword));
        });
    }

    /** @return array{first_name?: string, middle_name?: ?string, last_name?: string, position?: ?string} */
    private function representativeData(array $data, bool $required = true): array
    {
        $mapping = [
            'representative_first_name' => 'first_name',
            'representative_middle_name' => 'middle_name',
            'representative_last_name' => 'last_name',
            'representative_position' => 'position',
        ];
        $representative = [];

        foreach ($mapping as $source => $target) {
            if (array_key_exists($source, $data)) {
                $representative[$target] = $data[$source];
            }
        }

        if ($required && (! isset($representative['first_name'], $representative['last_name']))) {
            throw new \InvalidArgumentException('Representative first and last names are required.');
        }

        return $representative;
    }

    /** @return array<int, string> */
    private function representativeKeys(): array
    {
        return [
            'representative_first_name',
            'representative_middle_name',
            'representative_last_name',
            'representative_position',
        ];
    }
}
