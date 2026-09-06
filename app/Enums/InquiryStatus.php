<?php

namespace App\Enums;

enum InquiryStatus: string
{
    case Pending = 'pending';
    case Read = 'read';
    case InProgress = 'in_progress';
    case Replied = 'replied';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Read => 'Read',
            self::InProgress => 'In Progress',
            self::Replied => 'Replied',
            self::Closed => 'Closed',
        };
    }

    /** @return array<int, array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(fn (self $status): array => [
            'value' => $status->value,
            'label' => $status->label(),
        ], self::cases());
    }
}
