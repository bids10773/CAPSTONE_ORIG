<?php

namespace App\Mail;

use App\Models\Inquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InquiryReply extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Inquiry $inquiry) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Re: '.$this->inquiry->subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.inquiry-reply',
            with: [
                'senderName' => $this->inquiry->sender_name,
                'responseText' => $this->inquiry->response,
                'reference' => 'INQ-'.str_pad((string) $this->inquiry->id, 6, '0', STR_PAD_LEFT),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
