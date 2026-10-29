<?php

namespace App\Listeners;

use App\Events\NotificationCenterUpdated;
use App\Models\User;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Log;
use Throwable;

class BroadcastNotificationCenterUpdate
{
    public function handle(NotificationSent $event): void
    {
        if ($event->channel !== 'database' || ! $event->notifiable instanceof User) {
            return;
        }

        try {
            NotificationCenterUpdated::dispatch(
                $event->notifiable->id,
                $event->notifiable->visibleNotifications()->whereNull('read_at')->count(),
            );
        } catch (Throwable $exception) {
            Log::warning('Notification realtime update failed; polling will retry.', [
                'user_id' => $event->notifiable->id,
                'exception' => $exception::class,
            ]);
        }
    }
}
