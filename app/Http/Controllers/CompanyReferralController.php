<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCompanyReferralRequest;
use App\Models\CompanyReferral;
use App\Models\SecurityAudit;
use App\Services\CompanyReferralService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class CompanyReferralController extends Controller
{
    public function store(StoreCompanyReferralRequest $request, CompanyReferralService $service): RedirectResponse
    {
        $referral = $service->create($request->user(), $request->validated());
        SecurityAudit::create([
            'actor_id' => $request->user()->id,
            'target_user_id' => $referral->patient_id,
            'action' => 'company_referral_created',
            'status' => $referral->status,
            'metadata' => ['referral_id' => $referral->id, 'referral_number' => $referral->referral_number],
        ]);

        return back()->with('success', 'Employee referral created. Invitation status: '.$referral->status.'.');
    }

    public function invitation(Request $request, string $token): Response
    {
        $referral = $this->fromToken($token)->load('company:id,company_name');
        if ($referral->isExpired() && ! in_array($referral->status, ['scheduled', 'completed', 'cancelled'], true)) {
            $referral->update(['status' => 'expired']);
        } elseif (! $referral->viewed_at) {
            $referral->update(['viewed_at' => now(), 'status' => $referral->status === 'sent' ? 'viewed' : $referral->status]);
        }

        return Inertia::render('company-referrals/invitation', [
            'referral' => [
                'referral_number' => $referral->referral_number,
                'company' => $referral->company->company_name,
                'employee_name' => trim($referral->first_name.' '.$referral->middle_name.' '.$referral->last_name),
                'required_services' => $referral->required_services,
                'valid_until' => $referral->valid_until->toDateString(),
                'status' => $referral->status,
            ],
            'acceptUrl' => URL::temporarySignedRoute(
                'company-referrals.accept',
                $referral->valid_until->endOfDay(),
                ['token' => $token],
            ),
            'authenticated' => $request->user()?->role === 'patient',
        ]);
    }

    public function accept(Request $request, string $token): RedirectResponse
    {
        abort_unless($request->user()?->role === 'patient', 403);
        $referral = DB::transaction(function () use ($request, $token): CompanyReferral {
            $referral = CompanyReferral::query()->lockForUpdate()
                ->where('invitation_token_hash', hash('sha256', $token))->firstOrFail();
            abort_if($referral->isExpired() || ! $referral->isSchedulable(), 422, 'This referral is no longer available for scheduling.');
            abort_unless(strcasecmp((string) $request->user()->email, $referral->employee_email) === 0, 403);
            if ($referral->patient_id !== null) {
                abort_unless($referral->patient_id === $request->user()->id, 403);
            } else {
                $referral->update(['patient_id' => $request->user()->id]);
            }
            $referral->update(['status' => 'viewed', 'viewed_at' => $referral->viewed_at ?? now()]);

            return $referral;
        });

        return redirect()->route('appointment.create', ['referral' => $referral->id]);
    }

    public function cancel(Request $request, CompanyReferral $companyReferral): RedirectResponse
    {
        abort_unless($request->user()->role === 'company' && $companyReferral->company_id === $request->user()->company_id, 403);
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        abort_unless($companyReferral->isSchedulable(), 422);
        $companyReferral->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancelled_by' => $request->user()->id,
            'cancellation_reason' => $data['reason'],
        ]);

        return back()->with('success', 'Referral cancelled.');
    }

    private function fromToken(string $token): CompanyReferral
    {
        return CompanyReferral::where('invitation_token_hash', hash('sha256', $token))->firstOrFail();
    }
}
