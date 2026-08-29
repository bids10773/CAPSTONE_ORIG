<?php

namespace App\Notifications;

use App\Models\CompanyReferral;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class CompanyMedicalReferralInvitation extends Notification
{
    public function __construct(public readonly CompanyReferral $referral, private readonly string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = URL::temporarySignedRoute(
            'company-referrals.invitation',
            now()->addYear(),
            ['token' => $this->token],
        );

        return (new MailMessage)
            ->subject('Medical Examination Referral')
            ->view('email.company-referral-invitation', [
                'employeeName' => $this->referral->first_name,
                'companyName' => $this->referral->company->company_name,
                'referralNumber' => $this->referral->referral_number,
                'examinationPurpose' => $this->referral->examination_purpose,
                'validUntil' => $this->referral->valid_until,
                'url' => $url,
            ]);
    }
}
