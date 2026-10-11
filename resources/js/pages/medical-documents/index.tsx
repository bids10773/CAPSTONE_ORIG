import { Head, Link, router } from '@inertiajs/react';
import { Download, FileCheck2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, MedicalDocument } from '@/types';

type Paginator = {
    data: MedicalDocument[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Document Management', href: '/medical-documents' },
];
const label = (s: string) =>
    s.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function DocumentManagement({
    documents,
    filters = {},
    releaseMethods,
}: {
    documents: Paginator;
    filters?: Record<string, string>;
    releaseMethods: Record<string, string>;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const apply = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/medical-documents',
            { search, status, type, date_from: dateFrom, date_to: dateTo },
            { preserveState: true, replace: true },
        );
    };
    const release = (doc: MedicalDocument) => {
        const representative = window.confirm(
            'Is the recipient an authorized representative?',
        );
        const recipient_name = representative
            ? window.prompt('Representative full name')
            : null;
        const representative_verification = representative
            ? window.prompt('Identity/authorization verification details')
            : null;
        if (representative && (!recipient_name || !representative_verification))
            return;
        router.post(`/medical-documents/${doc.id}/release`, {
            recipient_type: representative
                ? 'authorized_representative'
                : 'patient',
            recipient_name,
            representative_verification,
            release_method: Object.keys(releaseMethods)[0],
            remarks: window.prompt('Remarks (optional)'),
        });
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Document Management" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 md:p-8">
                <div>
                    <h1 className="text-2xl font-bold">
                        Medical Document Management
                    </h1>
                    <p className="text-sm text-slate-600">
                        Prepare, release, and audit clinic-generated documents.
                    </p>
                </div>
                <form
                    onSubmit={apply}
                    className="flex flex-wrap gap-2 rounded-2xl border bg-white p-4"
                >
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Patient or document number"
                        className="min-w-60 flex-1 rounded-xl border px-3 py-2"
                    />
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-xl border px-3 py-2"
                    >
                        <option value="">All statuses</option>
                        {[
                            'pending',
                            'for_review',
                            'approved',
                            'ready_for_pickup',
                            'released',
                            'cancelled',
                            'voided',
                        ].map((s) => (
                            <option key={s} value={s}>
                                {label(s)}
                            </option>
                        ))}
                    </select>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="rounded-xl border px-3 py-2"
                    >
                        <option value="">All document types</option>
                        {[
                            'medical_certificate',
                            'physical_examination',
                            'laboratory_report',
                            'xray_report',
                        ].map((value) => (
                            <option key={value} value={value}>
                                {label(value)}
                            </option>
                        ))}
                    </select>
                    <input
                        aria-label="Requested from"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-xl border px-3 py-2"
                    />
                    <input
                        aria-label="Requested to"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-xl border px-3 py-2"
                    />
                    <button className="rounded-xl bg-slate-900 px-5 py-2 text-white">
                        Filter
                    </button>
                </form>
                <div className="overflow-x-auto rounded-2xl border bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                            <tr>
                                <th className="p-4">Document</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.data.map((doc) => (
                                <tr key={doc.id} className="border-t align-top">
                                    <td className="p-4">
                                        <strong>{doc.title}</strong>
                                        <div className="text-xs text-slate-500">
                                            {doc.document_number} ·{' '}
                                            {doc.related_service}
                                        </div>
                                        {(doc.releases?.length ?? 0) > 0 && (
                                            <details className="mt-3">
                                                <summary className="cursor-pointer text-xs font-semibold text-blue-700">
                                                    Release history (
                                                    {doc.releases?.length})
                                                </summary>
                                                {doc.releases?.map((r) => (
                                                    <div
                                                        key={r.id}
                                                        className="mt-2 rounded bg-slate-50 p-2 text-xs"
                                                    >
                                                        Released{' '}
                                                        {new Date(
                                                            r.released_at,
                                                        ).toLocaleString()}{' '}
                                                        by {r.released_by} to{' '}
                                                        {r.recipient_name ||
                                                            'patient'}{' '}
                                                        via{' '}
                                                        {label(
                                                            r.release_method,
                                                        )}
                                                        {r.reversed_at && (
                                                            <div className="text-red-700">
                                                                Reversed by{' '}
                                                                {r.reversed_by}:{' '}
                                                                {
                                                                    r.reversal_reason
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </details>
                                        )}
                                    </td>
                                    <td className="p-4">{doc.patient?.name}</td>
                                    <td className="p-4">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                                            {label(doc.status)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {doc.pdf_url && (
                                                <a
                                                    href={doc.pdf_url}
                                                    className="rounded-lg border p-2"
                                                    aria-label="Download PDF"
                                                >
                                                    <Download className="size-4" />
                                                </a>
                                            )}
                                            {doc.can?.mark_ready && (
                                                <button
                                                    onClick={() =>
                                                        router.patch(
                                                            `/medical-documents/${doc.id}/ready`,
                                                        )
                                                    }
                                                    className="rounded-lg bg-emerald-700 px-3 py-2 text-xs text-white"
                                                >
                                                    <FileCheck2 className="mr-1 inline size-4" />
                                                    Mark ready
                                                </button>
                                            )}
                                            {doc.can?.release && (
                                                <button
                                                    onClick={() => release(doc)}
                                                    className="rounded-lg bg-blue-700 px-3 py-2 text-xs text-white"
                                                >
                                                    Record release
                                                </button>
                                            )}
                                            {doc.can?.reverse && (
                                                <button
                                                    onClick={() => {
                                                        const reason =
                                                            window.prompt(
                                                                'Required reversal reason',
                                                            );
                                                        if (reason)
                                                            router.patch(
                                                                `/medical-documents/${doc.id}/release/reverse`,
                                                                { reason },
                                                            );
                                                    }}
                                                    className="rounded-lg border border-red-300 px-3 py-2 text-xs text-red-700"
                                                >
                                                    <RotateCcw className="mr-1 inline size-4" />
                                                    Reverse
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <nav className="flex flex-wrap gap-2">
                    {documents.links.map((link, i) =>
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                className={`rounded-lg border px-3 py-2 text-sm ${link.active ? 'bg-slate-900 text-white' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span
                                key={i}
                                className="rounded-lg border px-3 py-2 text-sm text-slate-300"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                </nav>
            </div>
        </AppLayout>
    );
}
