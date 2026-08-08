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
            ->greeting('Hello '.$this->referral->first_name.',')
            ->line($this->referral->company->company_name.' referred you for a medical examination.')
            ->line('Please securely review the referral and choose your appointment schedule before '.$this->referral->valid_until->format('F j, Y').'.')
            ->action('Complete Appointment', $url)
            ->line('This email does not contain medical findings or examination results.');
    }
}
