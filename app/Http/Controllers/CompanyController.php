<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $status = $request->get('status', '');

        $query = Company::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status === 'active') {
            $query->where('status', 'active');
        } elseif ($status === 'inactive') {
            $query->where('status', 'inactive');
        }

        $companies = $query->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/companies/index', [
            'companies' => $companies,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Show the form for creating a new company.
     */
    public function create(): Response
    {
        return Inertia::render('admin/companies/create');
    }

    /**
     * Store a newly created company.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', 'string', 'max:50'],
            'is_partnered' => ['nullable', 'boolean'],
            // Representative fields
            'representative_name' => ['required', 'string', 'max:255'],
            'representative_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'representative_contact' => ['required', 'string', 'max:20'],
            'send_invitation' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();
        $data['status'] = $data['status'] ?? 'active';
        $data['is_partnered'] = $data['is_partnered'] ?? false;
        
        // Determine if we should send invitation
        $sendInvitation = $data['send_invitation'] ?? true;
        unset($data['send_invitation']);

        $company = Company::create($data);

        // Create representative user and send invitation
        if ($sendInvitation && $company->representative_email) {
            try {
                $company->createRepresentativeUser();
                $message = 'Company created successfully! Invitation email sent to representative.';
            } catch (\Exception $e) {
                $message = 'Company created successfully! But failed to send invitation email: ' . $e->getMessage();
            }
        } else {
            $message = 'Company created successfully!';
        }

        return redirect()->route('admin.companies.index')
            ->with('success', $message);
    }

    /**
     * Show the form for editing the specified company.
     */
    public function edit(Company $company): Response
    {
        return Inertia::render('admin/companies/edit', [
            'company' => $company,
        ]);
    }

    /**
     * Update the specified company.
     */
    public function update(Request $request, Company $company)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', 'string', 'max:50'],
            'is_partnered' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $company->update($validator->validated());

        return redirect()->route('admin.companies.index')
            ->with('success', 'Company updated successfully!');
    }

    /**
     * Remove the specified company.
     */
    public function destroy(Company $company)
    {
        // Check if company has appointments
        if ($company->appointments()->count() > 0) {
            return back()->with('error', 'Cannot delete company with existing appointments.');
        }

        $company->delete();

        return redirect()->route('admin.companies.index')
            ->with('success', 'Company deleted successfully!');
    }

    /**
     * Toggle company partner status.
     */
    public function toggleActive(Company $company)
    {
        $company->update(['is_partnered' => !$company->is_partnered]);

        $status = $company->is_partnered ? 'partnered' : 'un-partnered';

        return back()->with('success', "Company {$status} successfully!");
    }
}

