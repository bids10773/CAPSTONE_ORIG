<?php

namespace App\Policies;

use App\Models\Inquiry;
use App\Models\User;

class InquiryPolicy
{
    public function before(User $user): ?bool
    {
        return $user->role === 'admin' ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, Inquiry $inquiry): bool
    {
        return false;
    }

    public function update(User $user, Inquiry $inquiry): bool
    {
        return false;
    }
}
