<?php

namespace App\Notifications;

use App\Models\Inquiry;
use App\Support\NotificationWording;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewInquirySubmitted extends Notification
{
    use Queueable;

    private readonly string $sender;

    public function __construct(private Inquiry $inquiry)
    {
        $this->sender = NotificationWording::actor($inquiry->user) ?? (filled($inquiry->sender_name) ? $inquiry->sender_name : 'A visitor');
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New inquiry received',
            'message' => $this->sender.' submitted inquiry INQ-'.str_pad((string) $this->inquiry->id, 6, '0', STR_PAD_LEFT).' ('.$this->inquiry->category->label().').',
            'url' => route('admin.inquiries.show', $this->inquiry, false),
            'type' => 'inquiry',
        ];
    }
}
