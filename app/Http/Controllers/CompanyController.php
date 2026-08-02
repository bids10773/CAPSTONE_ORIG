<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCompanyRequest;
use App\Http\Requests\UpdateCompanyRequest;
use App\Models\Company;
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
            ->when($search, fn ($query) => $query->where(fn ($q) => $q
                ->where('company_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->when(in_array($status, ['active', 'inactive'], true), fn ($query) => $query->where('status', $status))
            ->orderBy('company_name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/companies/index', [
            'companies' => $companies,
            'filters' => compact('search', 'status'),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Company::class);

        return Inertia::render('admin/companies/create', ['industryTypes' => Company::getIndustryTypes()]);
    }

    public function store(StoreCompanyRequest $request, CompanyAccountService $service): RedirectResponse
    {
        try {
            $service->create($request->safe()->except('logo'), $request->file('logo'), $request->user());
        } catch (Throwable $exception) {
            report($exception);

            return back()->withInput()->with('error', 'The company was not created because the invitation could not be sent. Check the email service and try again.');
        }

        return redirect()->route('admin.companies.index')
            ->with('success', 'Company account created. Temporary login credentials were sent to the company email.');
    }

    public function show(Company $company): Response
    {
        Gate::authorize('view', $company);

        return Inertia::render('admin/companies/show', ['company' => $company->load('account:id,company_id,must_change_password')]);
    }

    public function edit(Company $company): Response
    {
        Gate::authorize('update', $company);

        return Inertia::render('admin/companies/edit', [
            'company' => $company->load('account:id,company_id,must_change_password'),
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
