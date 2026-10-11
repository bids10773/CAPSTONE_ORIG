import { Head } from '@inertiajs/react';
import { FileText, Info } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, MedicalDocument } from '@/types';

const labels: Record<string, string> = {
    pending: 'Processing',
    for_review: 'For review',
    approved: 'Approved',
    ready_for_pickup: 'Ready for pickup',
    released: 'Released',
    cancelled: 'Cancelled',
    voided: 'Void',
};
const colors: Record<string, string> = {
    ready_for_pickup: 'bg-emerald-100 text-emerald-800',
    released: 'bg-slate-200 text-slate-700',
    approved: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    voided: 'bg-red-100 text-red-800',
};
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Medical Documents', href: '/my-medical-documents' },
];
const date = (value: string | null) =>
    value
        ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(
              new Date(value),
          )
        : '—';

export default function PatientDocuments({
    documents,
    releaseInstructions,
}: {
    documents: MedicalDocument[];
    releaseInstructions: string;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Medical Documents" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-950">
                        My Medical Documents
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Track document preparation and release status.
                    </p>
                </div>
                <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                    <Info className="mt-0.5 size-5 shrink-0" />
                    <p>{releaseInstructions}</p>
                </div>
                {documents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500">
                        <FileText className="mx-auto mb-3 size-8" />
                        No medical documents are currently registered.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {documents.map((doc) => (
                            <article
                                key={doc.id}
                                className="rounded-2xl border bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-slate-400">
                                            {doc.document_number}
                                        </p>
                                        <h2 className="mt-1 font-semibold text-slate-950">
                                            {doc.title}
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            {doc.related_service}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[doc.status] ?? 'bg-amber-100 text-amber-800'}`}
                                    >
                                        {labels[doc.status] ?? doc.status}
                                    </span>
                                </div>
                                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <dt className="text-slate-500">
                                            Requested
                                        </dt>
                                        <dd className="font-medium">
                                            {date(doc.requested_at)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-slate-500">
                                            Ready
                                        </dt>
                                        <dd className="font-medium">
                                            {date(doc.ready_at)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-slate-500">
                                            Released
                                        </dt>
                                        <dd className="font-medium">
                                            {date(doc.released_at)}
                                        </dd>
                                    </div>
                                </dl>
                                {doc.status === 'ready_for_pickup' && (
                                    <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                                        {doc.release_instructions ||
                                            releaseInstructions}
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
