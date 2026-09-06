<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InquiryCategory;
use App\Enums\InquiryStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReplyToInquiryRequest;
use App\Http\Requests\UpdateInquiryStatusRequest;
use App\Models\Inquiry;
use App\Services\InquiryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InquiryController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Inquiry::class);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', Rule::enum(InquiryCategory::class)],
            'status' => ['nullable', Rule::enum(InquiryStatus::class)],
        ]);
        $search = trim((string) ($filters['search'] ?? ''));

        $inquiries = Inquiry::query()
            ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested
                ->where('company_name', 'like', "%{$search}%")
                ->orWhere('sender_first_name', 'like', "%{$search}%")
                ->orWhere('sender_last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('subject', 'like', "%{$search}%")))
            ->when($filters['category'] ?? null, fn ($query, $category) => $query->where('category', $category))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/inquiries/index', [
            'inquiries' => $inquiries,
            'categories' => InquiryCategory::options(),
            'statuses' => InquiryStatus::options(),
            'filters' => [
                'search' => $search,
                'category' => $filters['category'] ?? '',
                'status' => $filters['status'] ?? '',
            ],
        ]);
    }

    public function show(Inquiry $inquiry, InquiryService $service): Response
    {
        Gate::authorize('view', $inquiry);
        $service->markRead($inquiry);

        return Inertia::render('admin/inquiries/show', [
            'inquiry' => $inquiry->fresh()->load('responder:id,first_name,middle_name,last_name'),
            'statuses' => InquiryStatus::options(),
            'canCreateCompany' => $inquiry->category === InquiryCategory::CompanyAccount
                && $inquiry->converted_company_id === null,
        ]);
    }

    public function updateStatus(UpdateInquiryStatusRequest $request, Inquiry $inquiry, InquiryService $service): RedirectResponse
    {
        $service->updateStatus($inquiry, InquiryStatus::from($request->validated('status')));

        return back()->with('success', 'Inquiry status updated.');
    }

    public function reply(ReplyToInquiryRequest $request, Inquiry $inquiry, InquiryService $service): RedirectResponse
    {
        $sent = $service->reply($inquiry, $request->validated('response'), $request->user());

        if (! $sent) {
            return back()->with('error', 'The response was saved, but the email could not be sent. Check the mail service and try again.');
        }

        return back()->with('success', 'Response saved and sent to the inquiry email.');
    }

    public function createCompany(Inquiry $inquiry): RedirectResponse
    {
        Gate::authorize('update', $inquiry);
        abort_unless($inquiry->category === InquiryCategory::CompanyAccount, 422, 'Only a company account inquiry can start company onboarding.');
        abort_if($inquiry->converted_company_id !== null, 422, 'This inquiry is already connected to a company account.');

        return to_route('admin.companies.create', ['inquiry' => $inquiry->id]);
    }
}
