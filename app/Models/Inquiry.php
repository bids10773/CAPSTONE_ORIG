<?php

namespace App\Models;

use App\Enums\InquiryCategory;
use App\Enums\InquiryStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inquiry extends Model
{
    protected $fillable = [
        'submission_key',
        'user_id',
        'company_id',
        'category',
        'sender_first_name',
        'sender_middle_name',
        'sender_last_name',
        'representative_position',
        'company_name',
        'email',
        'contact_number',
        'subject',
        'message',
        'status',
        'responded_by',
        'response',
        'responded_at',
        'converted_company_id',
    ];

    protected $appends = ['sender_name', 'category_label', 'status_label'];

    protected function casts(): array
    {
        return [
            'category' => InquiryCategory::class,
            'status' => InquiryStatus::class,
            'responded_at' => 'datetime',
        ];
    }

    public function getSenderNameAttribute(): string
    {
        return collect([
            $this->sender_first_name,
            $this->sender_middle_name,
            $this->sender_last_name,
        ])->filter(fn (?string $part): bool => filled($part))->implode(' ');
    }

    public function getCategoryLabelAttribute(): string
    {
        return $this->category->label();
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->status->label();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by');
    }

    public function convertedCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'converted_company_id');
    }
}
