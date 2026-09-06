import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    LoaderCircle,
    Mail,
    MessageSquare,
    UserRound,
} from 'lucide-react';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';

type Option = { value: string; label: string };
type Inquiry = {
    id: number;
    category: string;
    category_label: string;
    sender_name: string;
    sender_first_name: string;
    sender_middle_name?: string | null;
    sender_last_name: string;
    representative_position?: string | null;
    company_name?: string | null;
    email: string;
    contact_number?: string | null;
    subject: string;
    message: string;
    status: string;
    response?: string | null;
    responded_at?: string | null;
    converted_company_id?: number | null;
    created_at: string;
};

function Detail({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {label}
            </dt>
            <dd className="mt-1 text-sm font-medium whitespace-pre-wrap text-slate-900">
                {value || 'Not provided'}
            </dd>
        </div>
    );
}

export default function ShowInquiry({
    inquiry,
    statuses,
    canCreateCompany,
}: {
    inquiry: Inquiry;
    statuses: Option[];
    canCreateCompany: boolean;
}) {
    const reply = useForm({ response: inquiry.response ?? '' });
    const updateStatus = (status: string) =>
        router.patch(
            `/admin/inquiries/${inquiry.id}/status`,
            { status },
            { preserveScroll: true },
        );

    return (
        <AppLayout>
            <Head
                title={`Inquiry INQ-${String(inquiry.id).padStart(6, '0')}`}
            />
            <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
                <Link
                    href="/admin/inquiries"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-moss-700"
                >
                    <ArrowLeft className="size-4" /> Back to inquiries
                </Link>
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-moss-700 capitalize">
                            {inquiry.category_label}
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                            {inquiry.subject}
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            INQ-{String(inquiry.id).padStart(6, '0')} ·
                            Submitted{' '}
                            {new Date(inquiry.created_at).toLocaleString()}
                        </p>
                    </div>
                    <select
                        value={inquiry.status}
                        onChange={(event) => updateStatus(event.target.value)}
                        className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-semibold capitalize"
                    >
                        {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                </header>
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="space-y-6">
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-center gap-2 font-semibold text-slate-950">
                                <MessageSquare className="size-5 text-moss-700" />{' '}
                                Message
                            </div>
                            <p className="text-sm leading-7 whitespace-pre-wrap text-slate-700">
                                {inquiry.message}
                            </p>
                        </section>
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-center gap-2 font-semibold text-slate-950">
                                <Mail className="size-5 text-moss-700" /> Reply
                                by email
                            </div>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    reply.post(
                                        `/admin/inquiries/${inquiry.id}/reply`,
                                        { preserveScroll: true },
                                    );
                                }}
                            >
                                <textarea
                                    rows={7}
                                    maxLength={5000}
                                    value={reply.data.response}
                                    onChange={(event) =>
                                        reply.setData(
                                            'response',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-300 p-3"
                                    aria-invalid={!!reply.errors.response}
                                />
                                <InputError message={reply.errors.response} />
                                <div className="mt-3 flex justify-end">
                                    <button
                                        disabled={reply.processing}
                                        className="inline-flex items-center gap-2 rounded-xl bg-moss-700 px-5 py-2.5 font-semibold text-white disabled:opacity-60"
                                    >
                                        {reply.processing && (
                                            <LoaderCircle className="size-4 animate-spin" />
                                        )}
                                        {reply.processing
                                            ? 'Sending...'
                                            : 'Send reply'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                    <aside className="space-y-6">
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-center gap-2 font-semibold text-slate-950">
                                <UserRound className="size-5 text-moss-700" />{' '}
                                Sender details
                            </div>
                            <dl className="space-y-4">
                                <Detail
                                    label="Representative"
                                    value={inquiry.sender_name}
                                />
                                <Detail
                                    label="Position"
                                    value={inquiry.representative_position}
                                />
                                <Detail label="Email" value={inquiry.email} />
                                <Detail
                                    label="Contact"
                                    value={inquiry.contact_number}
                                />
                            </dl>
                        </section>
                        {inquiry.company_name && (
                            <section className="rounded-2xl border border-moss-200 bg-moss-50 p-6">
                                <div className="mb-4 flex items-center gap-2 font-semibold text-moss-950">
                                    <Building2 className="size-5" /> Company
                                </div>
                                <p className="font-semibold text-slate-950">
                                    {inquiry.company_name}
                                </p>
                                {canCreateCompany && (
                                    <Link
                                        href={`/admin/inquiries/${inquiry.id}/create-company`}
                                        className="mt-5 block rounded-xl bg-moss-700 px-4 py-2.5 text-center font-semibold text-white hover:bg-moss-800"
                                    >
                                        Create Company Account
                                    </Link>
                                )}
                                {inquiry.converted_company_id && (
                                    <Link
                                        href={`/admin/companies/${inquiry.converted_company_id}`}
                                        className="mt-4 block text-sm font-semibold text-moss-800"
                                    >
                                        View created company
                                    </Link>
                                )}
                            </section>
                        )}
                    </aside>
                </div>
            </main>
        </AppLayout>
    );
}
