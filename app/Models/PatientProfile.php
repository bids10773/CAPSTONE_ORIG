<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PatientProfile extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (PatientProfile $profile): void {
            if (filled($profile->employee_number) || ! $profile->user_id) {
                return;
            }

            $user = User::query()
                ->with('company:id,company_name')
                ->whereKey($profile->user_id)
                ->where('role', 'patient')
                ->whereNotNull('company_id')
                ->first();

            if ($user?->company) {
                $profile->employee_number = self::generatedEmployeeNumber(
                    (int) $profile->user_id,
                    $user->company->company_name
                );
            }
        });
    }

    public static function generatedEmployeeNumber(int $userId, string $companyName): string
    {
        return self::companyPrefix($companyName).'-'.str_pad((string) $userId, 6, '0', STR_PAD_LEFT);
    }

    public static function companyPrefix(string $companyName): string
    {
        $words = preg_split(
            '/[^A-Z0-9]+/',
            Str::upper(Str::ascii(trim($companyName))),
            -1,
            PREG_SPLIT_NO_EMPTY
        ) ?: [];

        if ($words === []) {
            return 'CMP';
        }

        if (count($words) === 1) {
            return substr($words[0], 0, 3);
        }

        return substr(implode('', array_map(fn (string $word): string => $word[0], $words)), 0, 6);
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'birthdate',
        'sex',
        'civil_status',
        'address',
        'employee_number',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
        ];
    }

    protected function age(): Attribute
    {
        return Attribute::get(fn (): ?int => $this->birthdate?->age);
    }

    /**
     * Get the user that owns the patient profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
