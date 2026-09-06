import { Head, Link } from '@inertiajs/react';
import { MessageSquare, Plus } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import type { PaginatedResponse } from '@/types/pagination';

type Inquiry = {
    id: number;
    category: string;
    category_label: string;
    subject: string;
    status: string;
    status_label: string;
    created_at: string;
};

export default function MyInquiries({
    inquiries,
}: {
    inquiries: PaginatedResponse<Inquiry>;
}) {
    return (
        <AppLayout>
            <Head title="My Inquiries" />
            <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-moss-700">
                            Contact LMIC
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                            My inquiries
                        </h1>
                    </div>
                    <Link
                        href="/inquiries/create"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-moss-700 px-4 py-2.5 font-semibold text-white hover:bg-moss-800"
                    >
                        <Plus className="size-4" /> Send inquiry
                    </Link>
                </header>
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {inquiries.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="mx-auto size-10 text-slate-300" />
                            <p className="mt-3 font-semibold text-slate-700">
                                No inquiries yet.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {inquiries.data.map((inquiry) => (
                                <article
                                    key={inquiry.id}
                                    className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {inquiry.subject}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            INQ-
                                            {String(inquiry.id).padStart(
                                                6,
                                                '0',
                                            )}{' '}
                                            · {inquiry.category_label}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <span className="rounded-full bg-moss-50 px-2.5 py-1 text-xs font-semibold text-moss-800">
                                            {inquiry.status_label}
                                        </span>
                                        <p className="mt-2 text-xs text-slate-500">
                                            {new Date(
                                                inquiry.created_at,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </article>
                            ))}
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
