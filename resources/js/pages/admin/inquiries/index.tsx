import { Head, Link } from '@inertiajs/react';
import { Eye, Inbox } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import { SearchFilterToolbar } from '@/components/search-filter-toolbar';
import AppLayout from '@/layouts/app-layout';
import type { PaginatedResponse } from '@/types/pagination';

type Option = { value: string; label: string };
type Inquiry = {
    id: number;
    category: string;
    category_label: string;
    sender_name: string;
    company_name?: string | null;
    email: string;
    subject: string;
    status: string;
    status_label: string;
    created_at: string;
};

export default function AdminInquiryIndex({
    inquiries,
    categories,
    statuses,
    filters,
}: {
    inquiries: PaginatedResponse<Inquiry>;
    categories: Option[];
    statuses: Option[];
    filters: { search: string; category: string; status: string };
}) {
    return (
        <AppLayout>
            <Head title="Inquiry Management" />
            <main className="space-y-6 p-4 sm:p-6">
                <SearchFilterToolbar
                    title="Inquiry Management"
                    search={{
                        name: 'search',
                        defaultValue: filters.search,
                        placeholder: 'Search inquiries',
                        'aria-label': 'Search inquiries',
                    }}
                    sections={[
                        {
                            label: 'Category',
                            content: (
                                <select
                                    name="category"
                                    defaultValue={filters.category}
                                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                >
                                    <option value="">All categories</option>
                                    {categories.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            ),
                        },
                        {
                            label: 'Status',
                            content: (
                                <select
                                    name="status"
                                    defaultValue={filters.status}
                                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                >
                                    <option value="">All statuses</option>
                                    {statuses.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            ),
                        },
                    ]}
                />
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {inquiries.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <Inbox className="mx-auto size-10 text-slate-300" />
                            <p className="mt-3 font-semibold text-slate-700">
                                {filters.search ||
                                filters.category ||
                                filters.status
                                    ? 'No inquiries match the selected filters.'
                                    : 'No inquiries found.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-5 py-3">ID</th>
                                        <th>Category</th>
                                        <th>Sender / Company</th>
                                        <th>Subject</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th className="pr-5 text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {inquiries.data.map((inquiry) => (
                                        <tr
                                            key={inquiry.id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-4 font-medium text-slate-600">
                                                INQ-
                                                {String(inquiry.id).padStart(
                                                    6,
                                                    '0',
                                                )}
                                            </td>
                                            <td className="capitalize">
                                                {inquiry.category_label}
                                            </td>
                                            <td>
                                                <p className="font-semibold text-slate-900">
                                                    {inquiry.sender_name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {inquiry.company_name ||
                                                        inquiry.email}
                                                </p>
                                            </td>
                                            <td className="max-w-64 truncate">
                                                {inquiry.subject}
                                            </td>
                                            <td>
                                                <span className="status-text-only text-xs font-bold text-moss-800 capitalize">
                                                    {inquiry.status_label}
                                                </span>
                                            </td>
                                            <td className="text-xs text-slate-500">
                                                {new Date(
                                                    inquiry.created_at,
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="pr-5 text-right">
                                                <Link
                                                    href={`/admin/inquiries/${inquiry.id}`}
                                                    className="inline-flex rounded-lg p-2 text-moss-700 hover:bg-moss-50"
                                                    aria-label={`Open inquiry ${inquiry.id}`}
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {inquiries.total > 0 && (
                        <Pagination pagination={inquiries} label="inquiries" />
                    )}
                </section>
            </main>
        </AppLayout>
    );
}
