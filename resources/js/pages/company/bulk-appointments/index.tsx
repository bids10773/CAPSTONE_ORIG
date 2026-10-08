import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    CalendarClock,
    CheckCircle2,
    Clock3,
    Download,
    FileSpreadsheet,
    MapPin,
    Plus,
    UsersRound,
} from 'lucide-react';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import {
    formatAppointmentDate,
    formatEventDateRange,
} from '@/lib/appointment-date-time';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedResponse } from '@/types/pagination';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Bulk Appointments', href: '/company/bulk-appointments' },
];

type BulkAppointment = {
    id: number;
    appointment_date: string;
    event_end_date: string | null;
    start_time: string | null;
    end_time: string | null;
    status: string;
    onsite_event_status: string | null;
    service_types: string[];
    service_location: string | null;
    event_address: string | null;
    expected_employee_count: number | null;
    employee_count: number;
    arrived_count: number;
    completed_count: number;
    report_status: string | null;
    report_download_url: string | null;
    masterlist_url: string | null;
};

type Props = {
    appointments: PaginatedResponse<BulkAppointment>;
    summary: {
        total: number;
        pending: number;
        scheduled: number;
        in_progress: number;
        completed: number;
    };
};

const statusMeta: Record<string, { label: string; className: string }> = {
    pending: {
        label: 'Awaiting clinic approval',
        className: 'text-amber-700 dark:text-amber-400',
    },
    accepted: {
        label: 'Scheduled',
        className: 'text-blue-700 dark:text-blue-400',
    },
    arrived: {
        label: 'In progress',
        className: 'text-violet-700 dark:text-violet-400',
    },
    for_diagnostics: {
        label: 'In progress',
        className: 'text-violet-700 dark:text-violet-400',
    },
    for_xray: {
        label: 'In progress',
        className: 'text-violet-700 dark:text-violet-400',
    },
    for_final_evaluation: {
        label: 'Final evaluation',
        className: 'text-indigo-700 dark:text-indigo-400',
    },
    completed: {
        label: 'Completed',
        className: 'text-emerald-700 dark:text-emerald-400',
    },
    rejected: {
        label: 'Rejected',
        className: 'text-red-700 dark:text-red-400',
    },
    cancelled: {
        label: 'Cancelled',
        className: 'text-red-700 dark:text-red-400',
    },
};

function appointmentStatus(appointment: BulkAppointment) {
    if (appointment.onsite_event_status === 'draft') {
        return {
            label: 'Draft — masterlist required',
            className: 'text-amber-700 dark:text-amber-400',
        };
    }

    const { status } = appointment;

    return (
        statusMeta[status] ?? {
            label: status.replaceAll('_', ' '),
            className: 'text-slate-600 dark:text-slate-300',
        }
    );
}

function reportLabel(appointment: BulkAppointment): string {
    if (appointment.onsite_event_status === 'draft') {
        return 'Upload masterlist first';
    }
    if (appointment.report_download_url) return 'Released';
    if (appointment.report_status === 'ready_for_review') {
        return 'Under clinic review';
    }
    if (appointment.status === 'completed') return 'Pending clinic release';
    return 'Not yet available';
}

export default function CompanyBulkAppointments({
    appointments,
    summary,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bulk Appointments" />

            <main className="space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold tracking-[0.16em] text-moss-700 uppercase">
                            Company workspace
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-100">
                            Bulk appointments
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                            Track clinic approval, exact schedules, employee
                            attendance progress, and report release.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/appointments/create">
                            <Plus className="size-4" />
                            Book bulk appointment
                        </Link>
                    </Button>
                </header>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {[
                        ['Total', summary.total, Building2],
                        ['Draft / awaiting approval', summary.pending, Clock3],
                        ['Scheduled', summary.scheduled, CalendarClock],
                        ['In progress', summary.in_progress, UsersRound],
                        ['Completed', summary.completed, CheckCircle2],
                    ].map(([label, value, Icon]) => {
                        const CardIcon = Icon as typeof Building2;
                        return (
                            <article
                                key={String(label)}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-border dark:bg-card"
                            >
                                <CardIcon className="size-4 text-moss-700" />
                                <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-slate-100">
                                    {Number(value).toLocaleString()}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {String(label)}
                                </p>
                            </article>
                        );
                    })}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                    {appointments.data.length === 0 ? (
                        <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                            <CalendarClock className="size-10 text-slate-300" />
                            <h2 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">
                                No bulk appointments yet
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Book a bulk appointment to begin coordinating a
                                company medical event.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-muted/40">
                                    <tr>
                                        <th className="px-5 py-3">Schedule</th>
                                        <th className="px-5 py-3">Services</th>
                                        <th className="px-5 py-3">Location</th>
                                        <th className="px-5 py-3">Employees</th>
                                        <th className="px-5 py-3">Progress</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">
                                            Report
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-border">
                                    {appointments.data.map((appointment) => {
                                        const status =
                                            appointmentStatus(appointment);
                                        return (
                                            <tr key={appointment.id}>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                        {appointment.onsite_event_status ===
                                                        'draft'
                                                            ? formatAppointmentDate(
                                                                  appointment.appointment_date,
                                                              )
                                                            : formatEventDateRange(
                                                                  appointment.appointment_date,
                                                                  appointment.event_end_date,
                                                                  appointment.start_time,
                                                                  appointment.end_time,
                                                              )}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Bulk #{appointment.id}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                    {appointment.service_types.join(
                                                        ', ',
                                                    ) || 'No services listed'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="flex items-center gap-1.5 text-slate-700 capitalize dark:text-slate-200">
                                                        <MapPin className="size-4 shrink-0 text-moss-600" />
                                                        {appointment.service_location ??
                                                            'Not assigned'}
                                                    </span>
                                                    {appointment.event_address && (
                                                        <p className="mt-1 max-w-52 truncate text-xs text-slate-400">
                                                            {
                                                                appointment.event_address
                                                            }
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                        {
                                                            appointment.employee_count
                                                        }{' '}
                                                        uploaded
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Expected:{' '}
                                                        {appointment.expected_employee_count ??
                                                            'Not specified'}
                                                    </p>
                                                    {appointment.masterlist_url && (
                                                        <Link
                                                            href={
                                                                appointment.masterlist_url
                                                            }
                                                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-moss-700 hover:underline"
                                                        >
                                                            <FileSpreadsheet className="size-3.5" />
                                                            Upload masterlist
                                                        </Link>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                    <p>
                                                        {
                                                            appointment.arrived_count
                                                        }{' '}
                                                        arrived
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {
                                                            appointment.completed_count
                                                        }{' '}
                                                        completed
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`font-semibold ${status.className}`}
                                                    >
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {appointment.report_download_url ? (
                                                        <a
                                                            href={
                                                                appointment.report_download_url
                                                            }
                                                            className="inline-flex items-center gap-1.5 font-semibold text-moss-700 hover:underline dark:text-moss-300"
                                                        >
                                                            <Download className="size-4" />
                                                            Download
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                                            {reportLabel(
                                                                appointment,
                                                            )}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Pagination
                        pagination={appointments}
                        label="bulk appointments"
                    />
                </section>
            </main>
        </AppLayout>
    );
}
