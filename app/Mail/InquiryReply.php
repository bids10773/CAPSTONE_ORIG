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

    public readonly string $responder;

    public function __construct(public Inquiry $inquiry)
    {
        $this->responder = \App\Support\NotificationWording::actor($inquiry->responded_by) ?? 'Living Myth Industrial Clinic';
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Inquiry reply | '.$this->inquiry->subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.inquiry-reply',
            with: [
                'senderName' => $this->inquiry->sender_name,
                'responder' => $this->responder,
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
