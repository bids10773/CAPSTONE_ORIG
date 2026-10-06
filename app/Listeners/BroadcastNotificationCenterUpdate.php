<?php

namespace App\Listeners;

use App\Events\NotificationCenterUpdated;
use App\Models\User;
use Illuminate\Notifications\Events\NotificationSent;

class BroadcastNotificationCenterUpdate
{
    public function handle(NotificationSent $event): void
    {
        if ($event->channel !== 'database' || ! $event->notifiable instanceof User) {
            return;
        }

        NotificationCenterUpdated::dispatch(
            $event->notifiable->id,
            $event->notifiable->unreadNotifications()->count(),
        );
    }
}
