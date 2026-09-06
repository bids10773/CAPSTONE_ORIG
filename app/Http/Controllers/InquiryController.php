<?php

namespace App\Http\Controllers;

use App\Enums\InquiryCategory;
use App\Http\Requests\StoreInquiryRequest;
use App\Models\Inquiry;
use App\Services\InquiryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InquiryController extends Controller
{
    public function index(Request $request): Response
    {
        $inquiries = Inquiry::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return Inertia::render('inquiries/index', ['inquiries' => $inquiries]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        $company = $user?->role === 'company' ? $user->company : null;
        $requestedCategory = (string) $request->query('category', InquiryCategory::General->value);
        $category = InquiryCategory::tryFrom($requestedCategory) ?? InquiryCategory::General;

        return Inertia::render('inquiries/create', [
            'categories' => InquiryCategory::options(),
            'submissionKey' => (string) Str::uuid(),
            'initialValues' => [
                'category' => $category->value,
                'sender_first_name' => $user?->first_name ?? '',
                'sender_middle_name' => $user?->middle_name ?? '',
                'sender_last_name' => $user?->last_name ?? '',
                'representative_position' => $user?->position ?? '',
                'company_name' => $company?->company_name ?? '',
                'email' => $company?->email ?? $user?->email ?? '',
                'contact_number' => $company?->contact_number ?? $user?->contact ?? '',
                'subject' => '',
                'message' => '',
            ],
            'isAuthenticated' => $user !== null,
        ]);
    }

    public function store(StoreInquiryRequest $request, InquiryService $service): RedirectResponse
    {
        $category = InquiryCategory::from($request->validated('category'));
        $service->submit($request->validated(), $request->user());

        $message = $category === InquiryCategory::CompanyAccount
            ? 'Your company account inquiry has been submitted. The clinic will review your request before an account can be created.'
            : 'Inquiry sent successfully.';

        return to_route('inquiries.create')->with('success', $message);
    }
}
