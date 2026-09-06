<?php

namespace App\Services;

use App\Enums\InquiryStatus;
use App\Mail\InquiryAcknowledgment;
use App\Mail\InquiryReply;
use App\Models\Inquiry;
use App\Models\User;
use App\Notifications\NewInquirySubmitted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Throwable;

class InquiryService
{
    public function submit(array $data, ?User $sender): Inquiry
    {
        $inquiry = DB::transaction(function () use ($data, $sender): Inquiry {
            return Inquiry::firstOrCreate(
                ['submission_key' => $data['submission_key']],
                [
                    ...$data,
                    'user_id' => $sender?->id,
                    'company_id' => $sender?->role === 'company' ? $sender->company_id : null,
                    'status' => InquiryStatus::Pending,
                ],
            );
        });

        if ($inquiry->wasRecentlyCreated) {
            $this->sendSubmissionMessages($inquiry);
        }

        return $inquiry;
    }

    public function markRead(Inquiry $inquiry): void
    {
        if ($inquiry->status === InquiryStatus::Pending) {
            $inquiry->update(['status' => InquiryStatus::Read]);
        }
    }

    public function updateStatus(Inquiry $inquiry, InquiryStatus $status): void
    {
        $inquiry->update(['status' => $status]);
    }

    public function reply(Inquiry $inquiry, string $response, User $admin): bool
    {
        DB::transaction(function () use ($inquiry, $response, $admin): void {
            $inquiry->update([
                'response' => $response,
                'responded_by' => $admin->id,
                'responded_at' => now(),
                'status' => InquiryStatus::Replied,
            ]);
        });

        try {
            Mail::to($inquiry->email)->send(new InquiryReply($inquiry->fresh()));

            return true;
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }
    }

    private function sendSubmissionMessages(Inquiry $inquiry): void
    {
        try {
            Mail::to($inquiry->email)->send(new InquiryAcknowledgment($inquiry));
        } catch (Throwable $exception) {
            report($exception);
        }

        try {
            $admins = User::query()->where('role', 'admin')->where('is_active', true)->get();
            Notification::send($admins, new NewInquirySubmitted($inquiry));
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
