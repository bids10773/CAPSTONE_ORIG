<?php

namespace App\Services;

use App\Models\CompanyReferral;
use App\Models\User;
use App\Notifications\CompanyMedicalReferralInvitation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class CompanyReferralService
{
    public function create(User $creator, array $data): CompanyReferral
    {
        [$referral, $token] = DB::transaction(function () use ($creator, $data): array {
            $patient = $this->findPatient($data);
            $token = Str::random(64);
            $referral = CompanyReferral::create([
                'company_id' => $creator->company_id,
                'patient_id' => $patient?->id,
                'created_by' => $creator->id,
                'referral_number' => 'REF-'.now()->format('Y').'-'.Str::upper(Str::random(10)),
                'invitation_token_hash' => hash('sha256', $token),
                'employee_email' => Str::lower($data['email']),
                'first_name' => trim($data['first_name']),
                'last_name' => trim($data['last_name']),
                'required_services' => array_values($data['service_types']),
                'valid_until' => today()->addDays(30),
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            return [$referral, $token];
        });

        try {
            Notification::route('mail', $referral->employee_email)
                ->notify(new CompanyMedicalReferralInvitation($referral->load('company'), $token));
        } catch (\Throwable $exception) {
            $referral->update(['status' => 'pending', 'sent_at' => null]);
            Log::error('Company referral invitation could not be sent.', [
                'referral_id' => $referral->id,
                'exception' => $exception,
            ]);
        }

        return $referral;
    }

    private function findPatient(array $data): ?User
    {
        return User::query()
            ->where('role', 'patient')
            ->whereRaw('LOWER(email) = ?', [Str::lower($data['email'])])
            ->first();
    }
}
