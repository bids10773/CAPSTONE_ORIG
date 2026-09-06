import { Head, Link } from '@inertiajs/react';
import { Eye, Filter, Inbox, Search } from 'lucide-react';
import { Pagination } from '@/components/pagination';
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
                <header>
                    <p className="text-sm font-semibold text-moss-700">
                        Communication
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                        Inquiry management
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Review public and account-holder messages. Company
                        inquiries never create accounts automatically.
                    </p>
                </header>
                <form
                    method="GET"
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_180px_auto]"
                >
                    <label className="relative">
                        <Search className="absolute top-3 left-3 size-4 text-slate-400" />
                        <input
                            name="search"
                            defaultValue={filters.search}
                            placeholder="Search inquiries"
                            className="min-h-11 w-full rounded-xl border border-slate-300 pr-3 pl-10"
                        />
                    </label>
                    <select
                        name="category"
                        defaultValue={filters.category}
                        className="min-h-11 rounded-xl border border-slate-300 bg-white px-3"
                    >
                        <option value="">All categories</option>
                        {categories.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                    <select
                        name="status"
                        defaultValue={filters.status}
                        className="min-h-11 rounded-xl border border-slate-300 bg-white px-3"
                    >
                        <option value="">All statuses</option>
                        {statuses.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-moss-700 px-4 font-semibold text-white">
                        <Filter className="size-4" /> Filter
                    </button>
                </form>
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
                                                <span className="rounded-full bg-moss-50 px-2.5 py-1 text-xs font-semibold text-moss-800 capitalize">
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
