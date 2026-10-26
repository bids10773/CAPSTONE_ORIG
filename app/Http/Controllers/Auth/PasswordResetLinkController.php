<?php

namespace App\Http\Controllers\Auth;

use App\Http\Responses\PasswordResetLinkResponse;
use Illuminate\Contracts\Support\Responsable;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController as FortifyPasswordResetLinkController;
use Laravel\Fortify\Http\Requests\SendPasswordResetLinkRequest;
use Throwable;

class PasswordResetLinkController extends FortifyPasswordResetLinkController
{
    public function store(SendPasswordResetLinkRequest $request): Responsable
    {
        try {
            return parent::store($request);
        } catch (Throwable $exception) {
            report($exception);

            return app(PasswordResetLinkResponse::class);
        }
    }
}
