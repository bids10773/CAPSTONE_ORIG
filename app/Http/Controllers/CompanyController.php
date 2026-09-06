<?php

namespace App\Http\Controllers;

use App\Enums\InquiryCategory;
use App\Http\Requests\StoreCompanyRequest;
use App\Http\Requests\UpdateCompanyRequest;
use App\Models\Company;
use App\Models\Inquiry;
use App\Services\CompanyAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CompanyController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Company::class);
        $search = trim((string) $request->get('search', ''));
        $status = (string) $request->get('status', '');

        $companies = Company::query()
            ->with(['account:id,company_id,must_change_password'])
            ->withCount('appointments')
            ->when($search, fn ($query) => $query->where(fn ($q) => $q
                ->where('company_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('contact_number', 'like', "%{$search}%")
                ->orWhere('address', 'like', "%{$search}%")))
            ->when(in_array($status, ['active', 'inactive'], true), fn ($query) => $query->where('status', $status))
            ->orderBy('company_name')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return Inertia::render('admin/companies/index', [
            'companies' => $companies,
            'filters' => compact('search', 'status'),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', Company::class);

        $inquiry = null;
        if ($request->filled('inquiry')) {
            $inquiry = Inquiry::query()->findOrFail($request->integer('inquiry'));
            Gate::authorize('view', $inquiry);
            abort_unless($inquiry->category === InquiryCategory::CompanyAccount, 422, 'Only a company account inquiry can prefill this form.');
            abort_if($inquiry->converted_company_id !== null, 422, 'This inquiry is already connected to a company account.');
        }

        return Inertia::render('admin/companies/create', [
            'industryTypes' => Company::getIndustryTypes(),
            'prefill' => $inquiry ? [
                'company_name' => $inquiry->company_name,
                'email' => $inquiry->email,
                'contact_number' => $inquiry->contact_number,
                'representative_first_name' => $inquiry->sender_first_name,
                'representative_middle_name' => $inquiry->sender_middle_name,
                'representative_last_name' => $inquiry->sender_last_name,
                'representative_position' => $inquiry->representative_position,
            ] : null,
            'sourceInquiryId' => $inquiry?->id,
        ]);
    }

    public function store(StoreCompanyRequest $request, CompanyAccountService $service): RedirectResponse
    {
        try {
            $service->create($request->safe()->except('logo'), $request->file('logo'), $request->user());
        } catch (Throwable $exception) {
            report($exception);

            return back()->withInput()->with('error', 'Unable to create the company account. No account was created. Check the application logs and email service, then try again.');
        }

        return redirect()->route('admin.companies.index')
            ->with('success', 'Company account created. Temporary login credentials were sent to the company email.');
    }

    public function show(Company $company): Response
    {
        Gate::authorize('view', $company);

        return Inertia::render('admin/companies/show', ['company' => $company->load('account:id,company_id,first_name,middle_name,last_name,position,email,contact,must_change_password')]);
    }

    public function edit(Company $company): Response
    {
        Gate::authorize('update', $company);

        return Inertia::render('admin/companies/edit', [
            'company' => $company->load('account:id,company_id,first_name,middle_name,last_name,position,email,contact,must_change_password'),
            'industryTypes' => Company::getIndustryTypes(),
        ]);
    }

    public function update(UpdateCompanyRequest $request, Company $company, CompanyAccountService $service): RedirectResponse
    {
        $service->update($company, $request->safe()->except('logo'), $request->file('logo'));

        return redirect()->route('admin.companies.index')->with('success', 'Company account updated successfully.');
    }

    public function destroy(Company $company): RedirectResponse
    {
        Gate::authorize('delete', $company);

        return back()->with('error', 'Company records are retained for medical and transaction history. Deactivate the account instead.');
    }

    public function toggleActive(Company $company, CompanyAccountService $service): RedirectResponse
    {
        Gate::authorize('update', $company);
        $status = $company->status === 'active' ? 'inactive' : 'active';
        $service->update($company, ['status' => $status], null);

        return back()->with('success', "Company account {$status}. Existing records were preserved.");
    }

    public function resendInvitation(Request $request, Company $company, CompanyAccountService $service): RedirectResponse
    {
        Gate::authorize('update', $company);
        if ($company->status !== 'active') {
            return back()->with('error', 'Activate the company before sending login credentials.');
        }

        try {
            $service->resendInvitation($company, $request->user());
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Credentials were not changed because the invitation could not be sent.');
        }

        return back()->with('success', 'New temporary credentials were sent. The previous temporary password is no longer valid.');
    }
}
