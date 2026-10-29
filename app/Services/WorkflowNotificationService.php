<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\WorkflowActivity;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class WorkflowNotificationService
{
    public function admins(string $type, string $title, string $message, string $url): void
    {
        $this->users(User::query()->where('role', 'admin')->where('is_active', true)->get(), $type, $title, $message, $url);
    }

    public function users(iterable $recipients, string $type, string $title, string $message, string $url): void
    {
        $recipients = collect($recipients);
        $ids = $recipients->map(fn ($recipient) => $recipient instanceof User ? $recipient->id : $recipient)
            ->filter(fn ($id) => is_numeric($id) && (int) $id > 0)->map(fn ($id) => (int) $id)->unique()->values()->all();
        if ($ids === []) {
            return;
        }
        $roles = User::query()->whereIn('id', $ids)->pluck('role', 'id')->all();
        $companies = User::query()->whereIn('id', $ids)->pluck('company_id', 'id')->all();
        foreach ($recipients as $recipient) {
            if ($recipient instanceof User) {
                $roles[$recipient->id] = $recipient->role;
                if (array_key_exists('company_id', $recipient->getAttributes())) {
                    $companies[$recipient->id] = $recipient->company_id;
                }
            }
        }
        $url = str_starts_with($url, '/') && ! str_starts_with($url, '//') && ! str_contains($url, '\\')
            ? $url : '/notifications';

        DB::afterCommit(function () use ($ids, $roles, $companies, $type, $title, $message, $url): void {
            foreach (User::query()->whereIn('id', $ids)->where('is_active', true)->get() as $recipient) {
                if (($roles[$recipient->id] ?? null) !== $recipient->role) {
                    continue;
                }
                if ($recipient->role === 'company' && (string) ($companies[$recipient->id] ?? '') !== (string) $recipient->company_id) {
                    continue;
                }
                try {
                    $recipient->notify(new WorkflowActivity($type, $title, $message, $url));
                } catch (Throwable $exception) {
                    Log::warning('Workflow notification delivery failed.', [
                        'recipient_id' => $recipient->id, 'type' => $type,
                        'exception' => $exception::class,
                    ]);
                }
            }
        });
    }
}
