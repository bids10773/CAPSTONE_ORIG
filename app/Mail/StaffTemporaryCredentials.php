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

    public function __construct(
        public User $staff,
        public string $temporaryPassword,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Staff Account Has Been Created',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.staff-temporary-credentials',
            with: [
                'staffName' => $this->staff->name,
                'loginEmail' => $this->staff->email,
                'temporaryPassword' => $this->temporaryPassword,
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
