<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StaffTemporaryCredentials extends Mailable
{
    use Queueable, SerializesModels;

    public readonly string $actorSuffix;

    public function __construct(
        public User $staff,
        public string $temporaryPassword,
        ?User $actor = null,
    ) {
        $this->actorSuffix = \App\Support\NotificationWording::by($actor);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Staff sign-in credentials | Living Myth Industrial Clinic',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.staff-temporary-credentials',
            with: [
                'staffName' => $this->staff->name,
                'actorSuffix' => $this->actorSuffix,
                'loginEmail' => $this->staff->email,
                'temporaryPassword' => $this->temporaryPassword,
                'role' => \App\Support\NotificationWording::role($this->staff->role),
                'expiresAt' => $this->staff->temporary_password_expires_at,
                'loginUrl' => route('login'),
                'systemName' => config('app.name'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
