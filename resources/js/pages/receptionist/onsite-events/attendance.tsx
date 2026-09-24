import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    MapPin,
    Search,
    UserCheck,
    UserRound,
    UsersRound,
    UserX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatEventDateRange } from '@/lib/appointment-date-time';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedResponse } from '@/types/pagination';

type Employee = {
    id: number;
    status: string;
    attendance_status: string | null;
    user: {
        first_name: string;
        middle_name?: string | null;
        last_name: string;
        patient_profile?: { employee_number?: string | null };
    };
    service_queues: Array<{
        service_role: string;
        status: string;
        assigned_staff?: { first_name: string; last_name: string };
    }>;
};

type Event = {
    id: number;
    appointment_date: string;
    event_end_date?: string | null;
    event_address?: string | null;
    status: string;
    company?: {
        company_name: string;
        address?: string | null;
    } | null;
};

type Props = {
    event: Event;
    employees: PaginatedResponse<Employee>;
    attendance: Record<string, number>;
    filters: { search: string };
};

const summaryCards: Array<{
    label: string;
    key: string;
    icon: LucideIcon;
    tone: 'moss' | 'blue' | 'amber' | 'rose';
}> = [
    { label: 'Total scheduled', key: 'total', icon: UsersRound, tone: 'moss' },
    { label: 'Arrived', key: 'arrived', icon: UserCheck, tone: 'blue' },
    {
        label: 'Not yet arrived',
        key: 'not_arrived',
        icon: Clock3,
        tone: 'amber',
    },
    { label: 'Absent', key: 'absent', icon: UserX, tone: 'rose' },
];

const toneStyles = {
    moss: 'bg-moss-50 text-moss-700 dark:bg-moss-950 dark:text-moss-300',
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
};

function employeeName(employee: Employee): string {
    return [
        employee.user.first_name,
        employee.user.middle_name,
        employee.user.last_name,
    ]
        .filter(Boolean)
        .join(' ');
}

function SummaryCard({
    label,
    value,
    icon: Icon,
    tone,
}: {
    label: string;
    value: number;
    icon: LucideIcon;
    tone: keyof typeof toneStyles;
}) {
    return (
        <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-border dark:bg-card">
            <span
                className={`grid size-11 shrink-0 place-items-center rounded-xl ${toneStyles[tone]}`}
            >
                <Icon className="size-5" />
            </span>
            <div>
                <p className="text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-muted-foreground">
                    {label}
                </p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-foreground">
                    {value}
                </p>
            </div>
        </article>
    );
}

export default function Attendance({
    event,
    employees,
    attendance,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const companyName = event.company?.company_name ?? 'Company event';
    const eventLocation = event.event_address ?? event.company?.address;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Onsite Events', href: '/receptionist/onsite-events' },
        {
            title: companyName,
            href: `/receptionist/onsite-events/${event.id}`,
        },
    ];

    function submit(formEvent: FormEvent) {
        formEvent.preventDefault();
        router.get(
            `/receptionist/onsite-events/${event.id}`,
            search ? { search } : {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function clearSearch() {
        setSearch('');
        router.get(
            `/receptionist/onsite-events/${event.id}`,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function mark(employee: Employee, status: 'arrived' | 'absent') {
        if (
            !confirm(
                `Verify employee: ${employeeName(employee)}\nEmployee No.: ${employee.user.patient_profile?.employee_number ?? 'Not provided'}\n\nMark this employee ${status.toUpperCase()}?`,
            )
        ) {
            return;
        }

        setProcessingId(employee.id);
        router.patch(
            `/receptionist/onsite-employees/${employee.id}/attendance`,
            {
                attendance_status: status,
                ...(status === 'absent' ? { absence_reason: 'no_show' } : {}),
            },
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${companyName} Attendance`} />
            <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <header className="relative overflow-hidden rounded-2xl border border-moss-200 bg-gradient-to-r from-moss-50 via-white to-white p-6 shadow-sm dark:border-border dark:from-moss-950 dark:via-card dark:to-card">
                    <div className="absolute -top-20 -right-16 size-56 rounded-full bg-moss-200/35 blur-3xl dark:bg-moss-700/10" />
                    <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        <div className="min-w-0">
                            <Link
                                href="/receptionist/onsite-events"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-moss-700 hover:text-moss-900 dark:text-moss-300 dark:hover:text-moss-200"
                            >
                                <ArrowLeft className="size-4" />
                                All onsite events
                            </Link>
                            <div className="mt-5 flex items-start gap-4">
                                <span className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-moss-700 text-white shadow-sm sm:grid">
                                    <ClipboardCheck className="size-6" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold tracking-[0.14em] text-moss-700 uppercase dark:text-moss-300">
                                        Onsite attendance
                                    </p>
                                    <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-foreground">
                                        {companyName}
                                    </h1>
                                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-muted-foreground">
                                        Verify employees before sending them to
                                        their assigned clinical queues.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid shrink-0 gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:min-w-[29rem] dark:text-slate-300">
                            <div className="flex items-center gap-2 rounded-xl border border-moss-100 bg-white/80 px-4 py-3 dark:border-border dark:bg-background/60">
                                <CalendarDays className="size-4 shrink-0 text-moss-700 dark:text-moss-300" />
                                <span className="font-medium">
                                    {formatEventDateRange(
                                        event.appointment_date,
                                        event.event_end_date,
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-moss-100 bg-white/80 px-4 py-3 dark:border-border dark:bg-background/60">
                                <MapPin className="size-4 shrink-0 text-moss-700 dark:text-moss-300" />
                                <span className="truncate font-medium">
                                    {eventLocation || 'Location not provided'}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <section
                    aria-label="Attendance summary"
                    className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {summaryCards.map((card) => (
                        <SummaryCard
                            key={card.key}
                            label={card.label}
                            value={attendance[card.key] ?? 0}
                            icon={card.icon}
                            tone={card.tone}
                        />
                    ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center dark:border-border">
                        <form
                            onSubmit={submit}
                            className="flex min-w-0 flex-1 gap-2"
                        >
                            <label className="relative min-w-0 flex-1">
                                <span className="sr-only">
                                    Search event employees
                                </span>
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(inputEvent) =>
                                        setSearch(inputEvent.target.value)
                                    }
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pr-3 pl-10 text-sm transition outline-none placeholder:text-slate-400 focus:border-moss-600 focus:ring-4 focus:ring-moss-500/15 dark:border-border dark:bg-background"
                                    placeholder="Search employee name or number"
                                />
                            </label>
                            <Button type="submit" className="h-11">
                                Search
                            </Button>
                            {filters.search && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11"
                                    onClick={clearSearch}
                                >
                                    Clear
                                </Button>
                            )}
                        </form>
                        <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
                            Showing {employees.from ?? 0}–{employees.to ?? 0} of{' '}
                            {employees.total} employees
                        </p>
                    </div>

                    {employees.data.length === 0 ? (
                        <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                            <span className="mb-4 grid size-16 place-items-center rounded-full bg-moss-50 text-moss-700 dark:bg-moss-950 dark:text-moss-300">
                                <UsersRound className="size-8" />
                            </span>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-foreground">
                                No employees found
                            </h2>
                            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-muted-foreground">
                                Try a different name or employee number. Results
                                are limited to this company event.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-bold tracking-wide text-slate-500 uppercase dark:bg-muted/40 dark:text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3.5">
                                            Employee
                                        </th>
                                        <th className="px-5 py-3.5">
                                            Employee no.
                                        </th>
                                        <th className="px-5 py-3.5">
                                            Attendance
                                        </th>
                                        <th className="px-5 py-3.5">
                                            Current process
                                        </th>
                                        <th className="px-5 py-3.5 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-border">
                                    {employees.data.map((employee) => {
                                        const attendanceStatus =
                                            employee.attendance_status ??
                                            'not_arrived';
                                        const isProcessing =
                                            processingId === employee.id;
                                        const arrivalLocked =
                                            attendanceStatus === 'arrived' ||
                                            attendanceStatus === 'absent';

                                        return (
                                            <tr
                                                key={employee.id}
                                                className="transition hover:bg-slate-50/70 dark:hover:bg-accent/40"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-moss-50 text-moss-700 dark:bg-moss-950 dark:text-moss-300">
                                                            <UserRound className="size-5" />
                                                        </span>
                                                        <span className="font-bold text-slate-900 dark:text-foreground">
                                                            {employeeName(
                                                                employee,
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 font-medium text-slate-600 dark:text-muted-foreground">
                                                    {employee.user
                                                        .patient_profile
                                                        ?.employee_number ??
                                                        '—'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        status={
                                                            attendanceStatus
                                                        }
                                                    />
                                                </td>
                                                <td className="px-5 py-4">
                                                    {attendanceStatus ===
                                                    'arrived' ? (
                                                        <StatusBadge
                                                            status={
                                                                employee.status
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2 whitespace-nowrap">
                                                        <Button
                                                            size="sm"
                                                            disabled={
                                                                arrivalLocked ||
                                                                isProcessing
                                                            }
                                                            onClick={() =>
                                                                mark(
                                                                    employee,
                                                                    'arrived',
                                                                )
                                                            }
                                                            className="bg-moss-700 text-white hover:bg-moss-800"
                                                        >
                                                            <CheckCircle2 className="size-4" />
                                                            Arrived
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={
                                                                attendanceStatus ===
                                                                    'absent' ||
                                                                isProcessing
                                                            }
                                                            onClick={() =>
                                                                mark(
                                                                    employee,
                                                                    'absent',
                                                                )
                                                            }
                                                            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/50"
                                                        >
                                                            <UserX className="size-4" />
                                                            Absent
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Pagination
                        pagination={employees}
                        label="event employees"
                    />
                </section>
            </main>
        </AppLayout>
    );
}
