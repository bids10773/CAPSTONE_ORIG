import { Head, router } from '@inertiajs/react';
import {
    CalendarClock,
    CheckCircle2,
    Clock3,
    Eye,
    Search,
    Stethoscope,
    UserRound,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { appointmentStatusLabel } from '@/lib/appointment-status';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedResponse } from '@/types/pagination';

type Person = {
    first_name: string;
    middle_name?: string | null;
    last_name: string;
};

type Appointment = {
    id: number;
    appointment_date: string;
    start_time: string | null;
    arrived_at?: string | null;
    type: string;
    status: string;
    company?: { company_name: string } | null;
    user: Person;
    doctor?: Person | null;
};

type Props = {
    appointments: PaginatedResponse<Appointment>;
    filters: { search: string };
    today: string;
    summary: {
        total: number;
        waiting: number;
        in_progress: number;
        completed: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: '/admin/appointments' },
    { title: "Today's Clinic Overview", href: '/admin/todays-appointments' },
];

const statusStyles: Record<string, string> = {
    pending: 'text-amber-700 dark:text-amber-400',
    accepted: 'text-indigo-700 dark:text-indigo-400',
    arrived: 'text-blue-700 dark:text-blue-400',
    for_diagnostics: 'text-cyan-700 dark:text-cyan-400',
    for_xray: 'text-violet-700 dark:text-violet-400',
    for_final_evaluation: 'text-purple-700 dark:text-purple-400',
    completed: 'text-emerald-700 dark:text-emerald-400',
};

const typeLabels: Record<string, string> = {
    individual: 'Individual',
    walk_in: 'Walk-in',
    company_referral: 'Company Referral',
    company_bulk: 'Company Bulk',
};

function fullName(person?: Person | null): string {
    if (!person) return 'Unassigned';
    return [person.first_name, person.middle_name, person.last_name]
        .filter(Boolean)
        .join(' ');
}

function formatTime(value: string | null, fallback?: string | null): string {
    const rawValue = value ?? fallback;
    if (!rawValue) return 'Unscheduled';

    const timeMatch = rawValue.match(
        /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/,
    );
    if (timeMatch) {
        const hour = Number(timeMatch[1]);
        const minute = timeMatch[2];
        if (hour >= 0 && hour <= 23) {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minute} ${period}`;
        }
    }

    const date = new Date(rawValue);
    if (Number.isNaN(date.getTime())) return 'Unscheduled';

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

export default function TodayAppointments({
    appointments,
    filters,
    today,
    summary,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const timeout = window.setTimeout(() => {
            router.get(
                '/admin/todays-appointments',
                {
                    search: search || undefined,
                    per_page: appointments.per_page,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);
        return () => window.clearTimeout(timeout);
    }, [search, appointments.per_page]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            router.reload({
                only: ['appointments', 'summary'],
            });
        }, 30_000);
        return () => window.clearInterval(interval);
    }, []);

    function updateStatus(appointment: Appointment, status: string) {
        setUpdatingId(appointment.id);
        router.patch(
            `/admin/appointments/${appointment.id}/status`,
            { status },
            {
                preserveScroll: true,
                onSuccess: () => setSelectedAppointment(null),
                onFinish: () => setUpdatingId(null),
            },
        );
    }

    function accept(appointment: Appointment) {
        setUpdatingId(appointment.id);
        router.patch(
            `/admin/appointments/${appointment.id}/status`,
            { status: 'accepted' },
            {
                preserveScroll: true,
                onSuccess: () => setSelectedAppointment(null),
                onFinish: () => setUpdatingId(null),
            },
        );
    }

    const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${today}T00:00:00`));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Today's Clinic Overview" />
            <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="relative overflow-hidden rounded-[2rem] bg-moss-800 p-6 text-white shadow-[0_18px_45px_-30px_rgba(23,50,34,.8)] sm:p-8">
                    <div className="absolute -top-20 -right-16 size-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-28 left-1/3 size-56 rounded-full bg-moss-400/20 blur-3xl" />
                    <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-[0.14em] text-moss-100 uppercase">
                                <CalendarClock className="size-4" /> Live clinic
                                overview
                            </span>
                            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                                Today&apos;s Clinic Overview
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-moss-100/80 sm:text-base">
                                Monitor patient flow, current workload, and
                                completed visits without taking over routine
                                receptionist decisions.
                            </p>
                            <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-moss-100">
                                <CalendarClock className="size-4" />{' '}
                                {formattedDate}
                            </p>
                        </div>
                        <div className="w-fit rounded-2xl border border-white/15 bg-white/10 px-6 py-4 backdrop-blur-sm">
                            <p className="text-xs font-bold tracking-[0.14em] text-moss-100 uppercase">
                                Patients today
                            </p>
                            <p className="mt-1 text-4xl font-black tracking-tight">
                                {summary.total}
                            </p>
                        </div>
                    </div>
                </header>

                <section
                    className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                    aria-label="Today's appointment summary"
                >
                    <SummaryCard
                        label="Total"
                        value={summary.total}
                        icon={CalendarClock}
                        tone="moss"
                    />
                    <SummaryCard
                        label="Waiting / Confirmed"
                        value={summary.waiting}
                        icon={Clock3}
                        tone="amber"
                    />
                    <SummaryCard
                        label="In Progress"
                        value={summary.in_progress}
                        icon={Stethoscope}
                        tone="blue"
                    />
                    <SummaryCard
                        label="Completed"
                        value={summary.completed}
                        icon={CheckCircle2}
                        tone="emerald"
                    />
                </section>

                <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_12px_35px_-28px_rgba(15,23,42,.35)] dark:border-border dark:bg-card">
                    <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between dark:border-border">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                                Today&apos;s patient flow
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
                                Automatically refreshed every 30 seconds
                            </p>
                        </div>
                        <label htmlFor="today-search" className="sr-only">
                            Search today's patients
                        </label>
                        <div className="relative w-full lg:max-w-md">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                id="today-search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search today's patients..."
                                className="h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 pr-11 pl-10 text-sm transition outline-none focus:border-moss-500 focus:bg-white focus:ring-4 focus:ring-moss-500/15 dark:border-border dark:bg-background"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    aria-label="Clear search"
                                    className="absolute top-0 right-0 flex h-12 w-11 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {appointments.data.length > 0 ? (
                        <>
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/80 text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase dark:bg-background/60 dark:text-slate-400">
                                        <tr>
                                            <th className="px-5 py-3">
                                                Patient
                                            </th>
                                            <th className="px-5 py-3">
                                                Schedule
                                            </th>
                                            <th className="px-5 py-3">Type</th>
                                            <th className="px-5 py-3">
                                                Doctor
                                            </th>
                                            <th className="px-5 py-3">
                                                Status
                                            </th>
                                            <th className="px-5 py-3 text-right">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-border">
                                        {appointments.data.map(
                                            (appointment) => (
                                                <AppointmentRow
                                                    key={appointment.id}
                                                    appointment={appointment}
                                                    onView={
                                                        setSelectedAppointment
                                                    }
                                                />
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="divide-y divide-slate-100 md:hidden dark:divide-border">
                                {appointments.data.map((appointment) => (
                                    <AppointmentCard
                                        key={appointment.id}
                                        appointment={appointment}
                                        onView={setSelectedAppointment}
                                    />
                                ))}
                            </div>
                            <Pagination
                                pagination={appointments}
                                label="appointments today"
                            />
                        </>
                    ) : (
                        <EmptyState
                            search={filters.search || search}
                            onClear={() => setSearch('')}
                        />
                    )}
                </section>

                <Dialog
                    open={selectedAppointment !== null}
                    onOpenChange={(open) =>
                        !open && setSelectedAppointment(null)
                    }
                >
                    {selectedAppointment && (
                        <DialogContent className="max-w-xl rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>Appointment Details</DialogTitle>
                                <DialogDescription>
                                    Appointment #{selectedAppointment.id} ·{' '}
                                    {appointmentStatusLabel(
                                        selectedAppointment.status,
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Detail
                                    label="Patient"
                                    value={fullName(selectedAppointment.user)}
                                />
                                <Detail
                                    label="Schedule"
                                    value={formatTime(
                                        selectedAppointment.start_time,
                                        selectedAppointment.arrived_at,
                                    )}
                                />
                                <Detail
                                    label="Type"
                                    value={
                                        typeLabels[selectedAppointment.type] ??
                                        selectedAppointment.type
                                    }
                                />
                                <Detail
                                    label="Doctor"
                                    value={fullName(selectedAppointment.doctor)}
                                />
                                {selectedAppointment.company && (
                                    <Detail
                                        label="Company"
                                        value={
                                            selectedAppointment.company
                                                .company_name
                                        }
                                    />
                                )}
                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-background">
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                        Status
                                    </p>
                                    <div className="mt-2">
                                        <StatusBadge
                                            status={selectedAppointment.status}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="gap-2 sm:justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedAppointment(null)}
                                >
                                    Close
                                </Button>
                                <div className="flex flex-wrap gap-2">
                                    {selectedAppointment.status === 'pending' &&
                                        selectedAppointment.type !==
                                            'individual' && (
                                            <Button
                                                type="button"
                                                disabled={
                                                    updatingId ===
                                                    selectedAppointment.id
                                                }
                                                onClick={() =>
                                                    accept(selectedAppointment)
                                                }
                                            >
                                                <CheckCircle2 className="size-4" />
                                                Confirm Appointment
                                            </Button>
                                        )}
                                    {selectedAppointment.status === 'pending' &&
                                        selectedAppointment.type ===
                                            'individual' && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    router.visit(
                                                        '/admin/appointments?status=pending&type=individual',
                                                    )
                                                }
                                            >
                                                Open oversight page
                                            </Button>
                                        )}
                                    {![
                                        'completed',
                                        'cancelled',
                                        'rejected',
                                    ].includes(selectedAppointment.status) && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            disabled={
                                                updatingId ===
                                                selectedAppointment.id
                                            }
                                            onClick={() =>
                                                updateStatus(
                                                    selectedAppointment,
                                                    'cancelled',
                                                )
                                            }
                                        >
                                            <XCircle className="size-4" />
                                            Cancel Appointment
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    )}
                </Dialog>
            </main>
        </AppLayout>
    );
}

function AppointmentRow({
    appointment,
    onView,
}: {
    appointment: Appointment;
    onView: (appointment: Appointment) => void;
}) {
    return (
        <tr
            className={
                appointment.status === 'completed'
                    ? 'bg-slate-50/60 text-slate-500 dark:bg-background/40 dark:text-slate-400'
                    : 'text-slate-700 transition-colors hover:bg-moss-50/40 dark:text-slate-200 dark:hover:bg-accent/40'
            }
        >
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-moss-50 text-moss-700 dark:bg-moss-950 dark:text-moss-300">
                        <UserRound className="size-4" />
                    </span>
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {fullName(appointment.user)}
                        </p>
                        {appointment.company && (
                            <p className="text-xs text-slate-500">
                                {appointment.company.company_name}
                            </p>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-5 py-4 font-medium">
                {formatTime(appointment.start_time, appointment.arrived_at)}
            </td>
            <td className="px-5 py-4">
                <TypeBadge type={appointment.type} />
            </td>
            <td className="px-5 py-4">{fullName(appointment.doctor)}</td>
            <td className="px-5 py-4">
                <StatusBadge status={appointment.status} />
            </td>
            <td className="px-5 py-4">
                <Actions appointment={appointment} onView={onView} />
            </td>
        </tr>
    );
}

function AppointmentCard({
    appointment,
    onView,
}: {
    appointment: Appointment;
    onView: (appointment: Appointment) => void;
}) {
    return (
        <article
            className={`space-y-4 p-5 ${appointment.status === 'completed' ? 'bg-slate-50/70 dark:bg-background/40' : ''}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-slate-950 dark:text-slate-100">
                        {fullName(appointment.user)}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {formatTime(
                            appointment.start_time,
                            appointment.arrived_at,
                        )}{' '}
                        · {typeLabels[appointment.type] ?? appointment.type}
                    </p>
                </div>
                <StatusBadge status={appointment.status} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
                Doctor: {fullName(appointment.doctor)}
            </p>
            <Actions appointment={appointment} onView={onView} />
        </article>
    );
}

function Actions({
    appointment,
    onView,
}: {
    appointment: Appointment;
    onView: (appointment: Appointment) => void;
}) {
    return (
        <div className="flex flex-wrap justify-end gap-2">
            <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onView(appointment)}
            >
                <Eye className="size-4" /> View
            </Button>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-background">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {label}
            </p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {value}
            </p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`inline-flex text-xs font-bold whitespace-nowrap ${statusStyles[status] ?? 'text-slate-700 dark:text-slate-300'}`}
        >
            {appointmentStatusLabel(status)}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    return (
        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-accent dark:text-slate-200">
            {typeLabels[type] ?? type}
        </span>
    );
}

function SummaryCard({
    label,
    value,
    icon: Icon,
    tone,
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    tone: 'moss' | 'amber' | 'blue' | 'emerald';
}) {
    const tones = {
        moss: 'bg-moss-50 text-moss-700 dark:bg-moss-950 dark:text-moss-300',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
        emerald:
            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    };

    return (
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-border dark:bg-card">
            <span
                className={`flex size-12 items-center justify-center rounded-2xl ${tones[tone]}`}
            >
                <Icon className="size-5" />
            </span>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {label}
                </p>
                <p className="mt-0.5 text-2xl font-bold text-slate-950 dark:text-white">
                    {value}
                </p>
            </div>
        </div>
    );
}

function EmptyState({
    search,
    onClear,
}: {
    search: string;
    onClear: () => void;
}) {
    return (
        <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-moss-50 text-moss-700">
                <CalendarClock className="size-7" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-slate-100">
                {search
                    ? 'No patient found'
                    : 'No appointments scheduled today.'}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search
                    ? `No appointment scheduled today matches “${search}”.`
                    : 'Confirmed appointments and walk-in patients for today will appear here.'}
            </p>
            {search && (
                <Button
                    type="button"
                    variant="outline"
                    className="mt-5"
                    onClick={onClear}
                >
                    Clear Search
                </Button>
            )}
        </div>
    );
}
