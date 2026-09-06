<?php

namespace App\Notifications;

use App\Models\Inquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewInquirySubmitted extends Notification
{
    use Queueable;

    public function __construct(private Inquiry $inquiry) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New inquiry received',
            'message' => $this->inquiry->sender_name.' submitted a '.$this->inquiry->category->label().'.',
            'url' => route('admin.inquiries.show', $this->inquiry, false),
            'type' => 'inquiry',
        ];
    }
}
