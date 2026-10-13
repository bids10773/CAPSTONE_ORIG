import { Head } from '@inertiajs/react';
import {
    Activity,
    Building2,
    CalendarDays,
    ClipboardList,
    FlaskConical,
    ScanLine,
    Stethoscope,
} from 'lucide-react';

import { Pagination } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import { appointmentStatusLabel } from '@/lib/appointment-status';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedResponse } from '@/types/pagination';

type Appointment = {
    id: number;
    reference_code?: string;
    appointment_date: string;
    status: string;
    type: string;
    user?: {
        first_name?: string;
        middle_name?: string | null;
        last_name?: string;
        name?: string;
    } | null;
    company?: { company_name?: string } | null;
};

type Props = {
    totalAppointments: number;
    monthlyAppointments: number;
    yearlyAppointments: number;
    statusBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
    topCompanies: Array<{ company_name: string; count: number }>;
    recentAppointments: PaginatedResponse<Appointment>;
    medicalRecords: {
        physicalExams: number;
        labResults: number;
        xrayReports: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/admin/reports' },
];

function titleCase(value: string): string {
    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function patientName(appointment: Appointment): string {
    if (appointment.user?.name) return appointment.user.name;

    return (
        [
            appointment.user?.first_name,
            appointment.user?.middle_name,
            appointment.user?.last_name,
        ]
            .filter(Boolean)
            .join(' ') || 'Patient unavailable'
    );
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(
        date,
    );
}

export default function AdminReports({
    totalAppointments,
    monthlyAppointments,
    yearlyAppointments,
    statusBreakdown,
    typeBreakdown,
    topCompanies,
    recentAppointments,
    medicalRecords,
}: Props) {
    const metrics = [
        {
            label: 'All appointments',
            value: totalAppointments,
            icon: ClipboardList,
        },
        {
            label: 'This month',
            value: monthlyAppointments,
            icon: CalendarDays,
        },
        {
            label: 'This year',
            value: yearlyAppointments,
            icon: Activity,
        },
    ];
    const clinicalTotals = [
        {
            label: 'Physical exams',
            value: medicalRecords.physicalExams,
            icon: Stethoscope,
        },
        {
            label: 'Laboratory reports',
            value: medicalRecords.labResults,
            icon: FlaskConical,
        },
        {
            label: 'X-ray reports',
            value: medicalRecords.xrayReports,
            icon: ScanLine,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <main className="space-y-6 p-4 sm:p-6 lg:p-8">
                <header>
                    <p className="text-xs font-bold tracking-[.16em] text-moss-700 uppercase">
                        Clinic analytics
                    </p>
                    <h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-slate-100">
                        Reports
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Appointment activity and completed clinical-record
                        totals.
                    </p>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    {metrics.map(({ label, value, icon: Icon }) => (
                        <article
                            key={label}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card"
                        >
                            <Icon className="size-5 text-moss-700" />
                            <p className="mt-4 text-3xl font-bold text-slate-950 dark:text-slate-100">
                                {value.toLocaleString()}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {label}
                            </p>
                        </article>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-3">
                    <Breakdown
                        title="Appointments by status"
                        values={statusBreakdown}
                        status
                    />
                    <Breakdown
                        title="Appointments by type"
                        values={typeBreakdown}
                    />
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                        <h2 className="font-bold text-slate-950 dark:text-slate-100">
                            Top companies
                        </h2>
                        <div className="mt-4 space-y-3">
                            {topCompanies.length ? (
                                topCompanies.map((company) => (
                                    <div
                                        key={company.company_name}
                                        className="flex items-center justify-between gap-3 text-sm"
                                    >
                                        <span className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <Building2 className="size-4 shrink-0 text-moss-700" />
                                            <span className="truncate">
                                                {company.company_name}
                                            </span>
                                        </span>
                                        <strong>
                                            {Number(
                                                company.count,
                                            ).toLocaleString()}
                                        </strong>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">
                                    No company appointments recorded.
                                </p>
                            )}
                        </div>
                    </article>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {clinicalTotals.map(({ label, value, icon: Icon }) => (
                        <article
                            key={label}
                            className="flex items-center gap-4 rounded-2xl border border-moss-100 bg-moss-50 p-5 dark:border-border dark:bg-card"
                        >
                            <span className="grid size-11 place-items-center rounded-xl bg-white text-moss-700 shadow-sm dark:bg-muted">
                                <Icon className="size-5" />
                            </span>
                            <div>
                                <p className="text-2xl font-bold text-slate-950 dark:text-slate-100">
                                    {value.toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {label}
                                </p>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-border">
                        <h2 className="font-bold text-slate-950 dark:text-slate-100">
                            Appointment detail
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase dark:bg-muted/40">
                                <tr>
                                    <th className="px-5 py-3">Reference</th>
                                    <th className="px-5 py-3">Patient</th>
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3">Company</th>
                                    <th className="px-5 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-border">
                                {recentAppointments.data.map((appointment) => (
                                    <tr key={appointment.id}>
                                        <td className="px-5 py-3 font-mono text-xs font-semibold text-moss-700">
                                            {appointment.reference_code ||
                                                `#${appointment.id}`}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                                            {patientName(appointment)}
                                        </td>
                                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                                            {formatDate(
                                                appointment.appointment_date,
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            {titleCase(appointment.type)}
                                        </td>
                                        <td className="px-5 py-3">
                                            {appointment.company
                                                ?.company_name || '—'}
                                        </td>
                                        <td className="px-5 py-3">
                                            {appointmentStatusLabel(
                                                appointment.status,
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!recentAppointments.data.length && (
                        <p className="p-8 text-center text-sm text-slate-500">
                            No appointments recorded.
                        </p>
                    )}
                    <Pagination
                        pagination={recentAppointments}
                        label="appointments"
                    />
                </section>
            </main>
        </AppLayout>
    );
}

function Breakdown({
    title,
    values,
    status = false,
}: {
    title: string;
    values: Record<string, number>;
    status?: boolean;
}) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
            <h2 className="font-bold text-slate-950 dark:text-slate-100">
                {title}
            </h2>
            <div className="mt-4 space-y-3">
                {Object.entries(values).map(([label, value]) => (
                    <div
                        key={label}
                        className="flex items-center justify-between gap-3 text-sm"
                    >
                        <span className="text-slate-600 dark:text-slate-400">
                            {status
                                ? appointmentStatusLabel(label)
                                : titleCase(label)}
                        </span>
                        <strong className="text-slate-950 dark:text-slate-100">
                            {Number(value).toLocaleString()}
                        </strong>
                    </div>
                ))}
                {!Object.keys(values).length && (
                    <p className="text-sm text-slate-500">No data recorded.</p>
                )}
            </div>
        </article>
    );
}
