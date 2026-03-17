<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\CompanyInvitation;

class Company extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'address',
        'status',
        'is_partnered',
        'representative_name',
        'representative_email',
        'representative_contact',
        'temp_password',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_partnered' => 'boolean',
        ];
    }

    /**
     * Get the appointments for this company.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Get the company users (employees registered under this company).
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get industry type options.
     */
    public static function getIndustryTypes(): array
    {
        return [
            'Manufacturing' => 'Manufacturing',
            'Healthcare' => 'Healthcare',
            'IT/BPO' => 'IT/BPO',
            'Retail' => 'Retail',
            'Construction' => 'Construction',
            'Food & Beverage' => 'Food & Beverage',
            'Logistics' => 'Logistics',
            'Education' => 'Education',
            'Finance' => 'Finance',
            'Others' => 'Others',
        ];
    }

    /**
     * Create company user account and send invitation.
     */
    public function createRepresentativeUser(): User
    {
        // Generate temporary password
        $tempPassword = substr(md5(uniqid(rand(), true)), 0, 8);
        
        // Create user with 'company' role
        $user = User::create([
            'first_name' => $this->representative_name,
            'middle_name' => null,
            'last_name' => null,
            'email' => $this->representative_email,
            'contact' => $this->representative_contact,
            'password' => Hash::make($tempPassword),
            'role' => 'company',
            'company_id' => $this->id,
            'is_active' => true,
            'email_verified_at' => now(), // Auto-verify since admin created this
        ]);

        // Store temp password temporarily (could be sent via email)
        $this->temp_password = $tempPassword;
        $this->save();

        // Send invitation email - DISABLED
        // Mail::to($this->representative_email)->send(new CompanyInvitation($this, $tempPassword));

        return $user;
    }
}
