<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class WorkflowActivity extends Notification
{
    public function __construct(
        private readonly string $type,
        private readonly string $title,
        private readonly string $message,
        private readonly string $url,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'url' => $this->url,
            'recipient_role' => $notifiable->role,
            ...($notifiable->role === 'company' ? ['recipient_company_id' => $notifiable->company_id] : []),
        ];
    }
}
