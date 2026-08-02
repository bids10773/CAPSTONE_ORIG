import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Download,
    FileHeart,
    FlaskConical,
    ScanLine,
    Stethoscope,
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: '/appointments' },
    { title: 'Medical record', href: '' },
];
type LaboratorySection = {
    label: string;
    column: string;
};

export default function AppointmentRecord({
    appointment,
    laboratorySections = {},
}: {
    appointment: any;
    laboratorySections: Record<string, LaboratorySection>;
}) {
    const patient = appointment.user;
    const services: string[] = appointment.service_types ?? [];
    const laboratoryEntries = Object.entries(laboratorySections);
    return (
        <>
            <Head title="Medical Record" />
            <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
                <Link
                    href="/appointments"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to appointments
                </Link>
                <header className="rounded-2xl bg-moss-700 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <FileHeart className="h-8 w-8" />
                        <div>
                            <p className="text-sm text-moss-100">
                                Patient medical record
                            </p>
                            <h1 className="text-2xl font-bold">
                                {patient.first_name} {patient.last_name}
                            </h1>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                        <Meta
                            label="Appointment"
                            value={`#${appointment.id}`}
                        />
                        <Meta
                            label="Date"
                            value={new Date(
                                appointment.appointment_date,
                            ).toLocaleDateString()}
                        />
                        <Meta
                            label="Status"
                            value={appointment.status.replaceAll('_', ' ')}
                        />
                    </div>
                </header>
                <section>
                    <h2 className="mb-3 text-lg font-bold text-slate-900">
                        Clinical forms
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {services.includes('PE') && (
                            <DocumentCard
                                icon={<Stethoscope />}
                                title="Physical Examination"
                                ready={!!appointment.physical_exam}
                                href={`/clinical-forms/${appointment.id}/physical-exam.pdf`}
                            />
                        )}
                        {laboratoryEntries.map(([key, section]) => (
                            <DocumentCard
                                key={key}
                                icon={<FlaskConical />}
                                title={`${section.label} Result`}
                                ready={
                                    !!appointment.lab_result?.[section.column]
                                }
                                href={`/clinical-forms/${appointment.id}/laboratory/${key}.pdf`}
                            />
                        ))}
                        {laboratoryEntries.length > 1 && (
                            <DocumentCard
                                icon={<FlaskConical />}
                                title="Combined Laboratory Report"
                                ready={!!appointment.lab_result}
                                href={`/clinical-forms/${appointment.id}/laboratory.pdf`}
                            />
                        )}
                        {services.includes('X-Ray') && (
                            <DocumentCard
                                icon={<ScanLine />}
                                title="X-Ray Report"
                                ready={!!appointment.xray_report}
                                href={`/clinical-forms/${appointment.id}/xray.pdf`}
                            />
                        )}
                    </div>
                </section>
            </main>
        </>
    );
}
function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-bold text-moss-200 uppercase">{label}</p>
            <p className="font-semibold capitalize">{value}</p>
        </div>
    );
}
function DocumentCard({
    icon,
    title,
    ready,
    href,
}: {
    icon: React.ReactNode;
    title: string;
    ready: boolean;
    href: string;
}) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-moss-700 [&>svg]:h-6 [&>svg]:w-6">
                {icon}
            </span>
            <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">
                {ready
                    ? 'Available in this medical record.'
                    : 'Not completed yet.'}
            </p>
            {ready && (
                <a
                    href={href}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-moss-600 px-3 py-2 text-sm font-semibold text-white"
                >
                    <Download className="h-4 w-4" />
                    Download PDF
                </a>
            )}
        </article>
    );
}
AppointmentRecord.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
