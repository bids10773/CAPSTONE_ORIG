import { Head, Link, usePage } from '@inertiajs/react';
import {
    Plus,
    Edit,
    Eye,
    ToggleLeft,
    ToggleRight,
    CalendarDays,
} from 'lucide-react';
import { Pagination } from '@/components/pagination';
import { SearchFilterToolbar } from '@/components/search-filter-toolbar';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Companies Management', href: '/admin/companies' },
];

interface Company {
    id: number;
    company_name: string;
    email: string;
    contact_number: string;
    address: string | null;
    status: string;
    industry_type: string;
    created_at: string;
    appointments_count: number;
    account: Array<{
        id: number;
        first_name: string;
        middle_name: string | null;
        last_name: string;
        position: string | null;
    }>;
}

function representativeName(company: Company): string {
    const representative = company.account[0];

    return representative
        ? [
              representative.first_name,
              representative.middle_name,
              representative.last_name,
          ]
              .filter(Boolean)
              .join(' ')
        : 'Not assigned';
}

export default function AdminCompaniesIndex() {
    const props = usePage().props as any;
    const { companies, filters } = props; // ✅ INCLUDE flash

    return (
        <>
            <Head title="Companies - Admin" />

            <div className="p-6">
                {/* Filters */}
                <div className="mb-6">
                    <SearchFilterToolbar
                        title="Companies"
                        search={{
                            name: 'search',
                            defaultValue: filters.search,
                            placeholder: 'Search company name...',
                            'aria-label': 'Search companies',
                        }}
                        hiddenFields={
                            <input
                                type="hidden"
                                name="per_page"
                                value={companies.per_page}
                            />
                        }
                        sections={[
                            {
                                label: 'Status',
                                content: (
                                    <select
                                        name="status"
                                        defaultValue={filters.status}
                                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                    >
                                        <option value="">All statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                ),
                            },
                        ]}
                        actions={
                            <Link
                                href="/admin/companies/create"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-moss-600 px-5 font-semibold text-white transition-colors hover:bg-moss-700"
                            >
                                <Plus className="h-4 w-4" />
                                Add Company
                            </Link>
                        }
                    />
                </div>

                {/* Companies Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Company Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Representative
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Email / Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Industry / Activity
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {companies.data.length > 0 ? (
                                    companies.data.map((company: Company) => (
                                        <tr
                                            key={company.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">
                                                    {company.company_name}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-800">
                                                    {representativeName(
                                                        company,
                                                    )}
                                                </p>
                                                {company.account[0]
                                                    ?.position && (
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {
                                                            company.account[0]
                                                                .position
                                                        }
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-gray-600">
                                                    {company.email}
                                                    <br />
                                                    <span className="text-xs text-gray-500">
                                                        {company.contact_number}
                                                    </span>
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        company.status ===
                                                        'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {company.status === 'active'
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">
                                                    {company.industry_type}
                                                </span>
                                                <span className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    {company.appointments_count}{' '}
                                                    appointment
                                                    {company.appointments_count ===
                                                    1
                                                        ? ''
                                                        : 's'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/companies/${company.id}`}
                                                        className="p-1 text-gray-400 hover:text-moss-600"
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/companies/${company.id}/edit`}
                                                        className="p-1 text-gray-400 hover:text-moss-600"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/companies/${company.id}/toggle-active`}
                                                        method="patch"
                                                        className={`p-1 ${company.status === 'active' ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}
                                                        title={
                                                            company.status ===
                                                            'active'
                                                                ? 'Deactivate'
                                                                : 'Activate'
                                                        }
                                                        as="button"
                                                        onClick={(event) => {
                                                            if (
                                                                !confirm(
                                                                    `${company.status === 'active' ? 'Deactivate' : 'Activate'} ${company.company_name}? ${company.status === 'active' ? 'Its linked login will no longer be able to sign in.' : 'Its linked login will regain access.'}`,
                                                                )
                                                            )
                                                                event.preventDefault();
                                                        }}
                                                    >
                                                        {company.status ===
                                                        'active' ? (
                                                            <ToggleRight className="h-4 w-4" />
                                                        ) : (
                                                            <ToggleLeft className="h-4 w-4" />
                                                        )}
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            No companies found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination pagination={companies} label="companies" />
                </div>
            </div>
        </>
    );
}

AdminCompaniesIndex.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
