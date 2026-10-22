import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, FileText, Info } from 'lucide-react';
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
    ready_for_pickup: 'text-emerald-700',
    released: 'text-emerald-700',
    approved: 'text-blue-700',
    cancelled: 'text-red-600',
    voided: 'text-red-600',
};
const date = (value: string | null) =>
    value
        ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(
              new Date(value),
          )
        : '—';

type AppointmentSummary = NonNullable<MedicalDocument['appointment']>;

export default function PatientDocuments({
    documents,
    selectedAppointment,
    releaseInstructions,
}: {
    documents: MedicalDocument[];
    selectedAppointment: AppointmentSummary | null;
    releaseInstructions: string;
}) {
    const groupedDocuments = Array.from(
        documents
            .reduce((groups, document) => {
                const key = document.appointment
                    ? `appointment-${document.appointment.id}`
                    : 'other';
                const group = groups.get(key) ?? [];
                group.push(document);
                groups.set(key, group);

                return groups;
            }, new Map<string, MedicalDocument[]>())
            .entries(),
    );
    const pageTitle = selectedAppointment
        ? `Medical Records · ${selectedAppointment.reference_code}`
        : 'My Medical Records';
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Medical Records', href: '/my-medical-documents' },
        ...(selectedAppointment
            ? [{ title: selectedAppointment.reference_code, href: '' }]
            : []),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex w-full flex-col gap-6 p-4 md:p-8">
                {selectedAppointment && (
                    <div>
                        <Link
                            href={`/appointments/${selectedAppointment.id}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-moss-300 hover:bg-moss-50 hover:text-moss-800"
                        >
                            <ArrowLeft className="size-4" />
                            Back to appointment
                        </Link>
                    </div>
                )}

                <div>
                    <h1 className="text-2xl font-bold text-slate-950">
                        {selectedAppointment
                            ? `Medical Records for ${selectedAppointment.reference_code}`
                            : 'My Medical Records'}
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        {selectedAppointment
                            ? `Only records from the ${date(selectedAppointment.appointment_date)} appointment are shown.`
                            : 'Records are grouped by appointment so each visit stays separate.'}
                    </p>
                </div>

                <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                    <Info className="mt-0.5 size-5 shrink-0" />
                    <p>{releaseInstructions}</p>
                </div>

                {documents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500">
                        <FileText className="mx-auto mb-3 size-8" />
                        {selectedAppointment
                            ? 'No medical documents are registered for this appointment.'
                            : 'No medical documents are currently registered.'}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groupedDocuments.map(([groupKey, group]) => {
                            const appointment = group[0].appointment;

                            return (
                                <section
                                    key={groupKey}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60"
                                >
                                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
                                        <div>
                                            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                                <CalendarDays className="size-4" />
                                                {appointment
                                                    ? date(
                                                          appointment.appointment_date,
                                                      )
                                                    : 'Other medical document'}
                                            </p>
                                            <h2 className="mt-1 font-bold text-slate-950">
                                                {appointment?.reference_code ??
                                                    'Not linked to an appointment'}
                                            </h2>
                                        </div>
                                        {appointment &&
                                            !selectedAppointment && (
                                                <Link
                                                    href={`/appointments/${appointment.id}`}
                                                    className="rounded-xl border border-moss-200 px-3.5 py-2 text-sm font-semibold text-moss-700 transition hover:bg-moss-50"
                                                >
                                                    View appointment
                                                </Link>
                                            )}
                                    </header>

                                    <div className="grid gap-4 p-4 md:grid-cols-2">
                                        {group.map((document) => (
                                            <DocumentCard
                                                key={document.id}
                                                document={document}
                                                releaseInstructions={
                                                    releaseInstructions
                                                }
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function DocumentCard({
    document,
    releaseInstructions,
}: {
    document: MedicalDocument;
    releaseInstructions: string;
}) {
    return (
        <article className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-slate-400">
                        {document.document_number}
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-950">
                        {document.title}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {document.related_service}
                    </p>
                </div>
                <span
                    className={`status-text-only inline-flex text-xs font-bold ${colors[document.status] ?? 'text-amber-600'}`}
                >
                    {labels[document.status] ?? document.status}
                </span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                    <dt className="text-slate-500">Requested</dt>
                    <dd className="font-medium">
                        {date(document.requested_at)}
                    </dd>
                </div>
                <div>
                    <dt className="text-slate-500">Ready</dt>
                    <dd className="font-medium">{date(document.ready_at)}</dd>
                </div>
                <div>
                    <dt className="text-slate-500">Released</dt>
                    <dd className="font-medium">
                        {date(document.released_at)}
                    </dd>
                </div>
            </dl>
            {document.status === 'ready_for_pickup' && (
                <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                    {document.release_instructions || releaseInstructions}
                </p>
            )}
        </article>
    );
}
