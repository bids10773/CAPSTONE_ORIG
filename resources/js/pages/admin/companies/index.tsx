import { Head, Link, usePage } from '@inertiajs/react';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Eye,
    ToggleLeft,
    ToggleRight,
    CalendarDays,
} from 'lucide-react';
import { Pagination } from '@/components/pagination';
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
}

export default function AdminCompaniesIndex() {
    const props = usePage().props as any;
    const { companies, filters } = props; // ✅ INCLUDE flash

    return (
        <>
            <Head title="Companies - Admin" />

            <div className="p-6">
                {/* Filters */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <form method="GET" className="flex flex-wrap gap-4">
                        <input
                            type="hidden"
                            name="per_page"
                            value={companies.per_page}
                        />
                        <div className="min-w-[200px] flex-1">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Search company name..."
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-900 placeholder-gray-400 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                />
                            </div>
                        </div>
                        <select
                            name="status"
                            defaultValue={filters.status}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <button
                            type="submit"
                            className="flex min-h-11 items-center gap-2 rounded-xl bg-moss-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-moss-600 focus-visible:ring-4 focus-visible:ring-moss-500/20 focus-visible:outline-none"
                        >
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>

                        <Link
                            href="/admin/companies/create"
                            className="inline-flex items-center gap-2 rounded-lg bg-moss-600 px-4 py-2 text-white transition-colors hover:bg-moss-700"
                        >
                            <Plus className="h-4 w-4" />
                            Add Company
                        </Link>
                    </form>
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
                                                    {company.appointments_count} appointment{company.appointments_count === 1 ? '' : 's'}
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
                                                            if (!confirm(`${company.status === 'active' ? 'Deactivate' : 'Activate'} ${company.company_name}? ${company.status === 'active' ? 'Its linked login will no longer be able to sign in.' : 'Its linked login will regain access.'}`)) event.preventDefault();
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
                                            colSpan={5}
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
