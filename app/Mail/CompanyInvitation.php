<?php

namespace App\Mail;

use App\Models\Company;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CompanyInvitation extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public readonly string $actorSuffix;

    public function __construct(
        public Company $company,
        public User $representative,
        public string $tempPassword,
        ?User $actor = null,
    ) {
        $this->actorSuffix = \App\Support\NotificationWording::by($actor);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Company portal sign-in credentials | Living Myth Industrial Clinic',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'email.company-invitation',
            with: [
                'company' => $this->company,
                'companyName' => $this->company->company_name,
                'actorSuffix' => $this->actorSuffix,
                'representativeName' => $this->representative->name,
                'loginEmail' => $this->company->email,
                'temporaryPassword' => $this->tempPassword,
                'expiresAt' => $this->representative->temporary_password_expires_at,
                'loginUrl' => route('login'),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
