import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    FlaskConical,
    MapPin,
    Play,
    ScanLine,
    Search,
    Stethoscope,
    UserRound,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatEventDateRange } from '@/lib/appointment-date-time';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedResponse } from '@/types/pagination';

type Role = 'doctor' | 'medtech' | 'radtech';

type Queue = {
    id: number;
    service_role: string;
    status: string;
    appointment: {
        id: number;
        attendance_status: string;
        status: string;
        user: {
            first_name: string;
            middle_name?: string | null;
            last_name: string;
        };
        patient_profile?: { employee_number?: string | null };
    };
};

type Event = {
    id: number;
    appointment_date: string;
    event_end_date?: string | null;
    event_address?: string | null;
    company?: {
        company_name: string;
        address?: string | null;
    } | null;
};

type Props = {
    event: Event;
    queues: PaginatedResponse<Queue>;
    attendance: Record<string, number>;
    role: Role;
    filters: { search?: string };
};

const rolePresentation: Record<
    Role,
    { label: string; description: string; icon: LucideIcon }
> = {
    doctor: {
        label: 'Doctor workspace',
        description:
            'Complete physical examinations and final medical evaluations for your assigned employees.',
        icon: Stethoscope,
    },
    medtech: {
        label: 'Medical Technology workspace',
        description:
            'Process laboratory examinations and verification tasks for your assigned employees.',
        icon: FlaskConical,
    },
    radtech: {
        label: 'Radiology workspace',
        description:
            'Perform and finalize X-ray examinations for your assigned employees.',
        icon: ScanLine,
    },
};

const summaryCards: Array<{
    label: string;
    key: 'total' | 'arrived' | 'completed' | 'mine';
    icon: LucideIcon;
    tone: 'moss' | 'blue' | 'emerald' | 'violet';
}> = [
    { label: 'Employees', key: 'total', icon: UsersRound, tone: 'moss' },
    { label: 'Arrived', key: 'arrived', icon: Clock3, tone: 'blue' },
    {
        label: 'Completed',
        key: 'completed',
        icon: CheckCircle2,
        tone: 'emerald',
    },
    { label: 'My queue', key: 'mine', icon: ClipboardList, tone: 'violet' },
];

const toneStyles = {
    moss: 'bg-moss-50 text-moss-700 dark:bg-moss-950 dark:text-moss-300',
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
    emerald:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
};

const queueStatusStyles: Record<string, string> = {
    assigned:
        'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300',
    in_progress:
        'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300',
    waiting:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
    completed:
        'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
};

function employeeName(queue: Queue): string {
    return [
        queue.appointment.user.first_name,
        queue.appointment.user.middle_name,
        queue.appointment.user.last_name,
    ]
        .filter(Boolean)
        .join(' ');
}

function queueAction(role: Role, queue: Queue): string {
    if (role === 'medtech') {
        return `/medtech/lab-results/${queue.appointment.id}`;
    }
    if (role === 'radtech') {
        return `/radtech/xrays/${queue.appointment.id}`;
    }
    if (queue.service_role === 'doctor') {
        return `/doctor/physical-exam-form/${queue.appointment.id}`;
    }
    return `/doctor/final-evaluation/${queue.appointment.id}`;
}

function taskLabel(task: string): string {
    return (
        {
            doctor: 'Physical examination',
            medtech: 'Laboratory examination',
            radtech: 'X-ray examination',
            drug_verification: 'Official drug-test verification',
            final_evaluation: 'Final medical evaluation',
        }[task] ?? task.replaceAll('_', ' ')
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

export default function StaffOnsiteEvent({
    event,
    queues,
    attendance,
    role,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const companyName = event.company?.company_name ?? 'Company event';
    const eventLocation = event.event_address ?? event.company?.address;
    const presentation = rolePresentation[role];
    const HeaderIcon = presentation.icon;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Onsite Events', href: `/${role}/onsite-events` },
        { title: companyName, href: `/${role}/onsite-events/${event.id}` },
    ];

    function submit(formEvent: FormEvent) {
        formEvent.preventDefault();
        router.get(
            `/${role}/onsite-events/${event.id}`,
            search ? { search } : {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function clearSearch() {
        setSearch('');
        router.get(
            `/${role}/onsite-events/${event.id}`,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${companyName} Queue`} />
            <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <header className="relative overflow-hidden rounded-2xl border border-moss-200 bg-gradient-to-r from-moss-50 via-white to-white p-6 shadow-sm dark:border-border dark:from-moss-950 dark:via-card dark:to-card">
                    <div className="absolute -top-20 -right-16 size-56 rounded-full bg-moss-200/35 blur-3xl dark:bg-moss-700/10" />
                    <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        <div className="min-w-0">
                            <Link
                                href={`/${role}/onsite-events`}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-moss-700 hover:text-moss-900 dark:text-moss-300 dark:hover:text-moss-200"
                            >
                                <ArrowLeft className="size-4" />
                                Onsite events
                            </Link>
                            <div className="mt-5 flex items-start gap-4">
                                <span className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-moss-700 text-white shadow-sm sm:grid">
                                    <HeaderIcon className="size-6" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold tracking-[0.14em] text-moss-700 uppercase dark:text-moss-300">
                                        {presentation.label}
                                    </p>
                                    <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-foreground">
                                        {companyName}
                                    </h1>
                                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-muted-foreground">
                                        {presentation.description}
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
                                    {eventLocation || 'Onsite'}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <section
                    aria-label="Event queue summary"
                    className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {summaryCards.map((card) => (
                        <SummaryCard
                            key={card.key}
                            label={card.label}
                            value={
                                card.key === 'mine'
                                    ? queues.total
                                    : (attendance[card.key] ?? 0)
                            }
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
                                    Search assigned employees
                                </span>
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(inputEvent) =>
                                        setSearch(inputEvent.target.value)
                                    }
                                    placeholder="Search employee name or number"
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pr-3 pl-10 text-sm transition outline-none placeholder:text-slate-400 focus:border-moss-600 focus:ring-4 focus:ring-moss-500/15 dark:border-border dark:bg-background"
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
                            Showing {queues.from ?? 0}–{queues.to ?? 0} of{' '}
                            {queues.total} queue tasks
                        </p>
                    </div>

                    {queues.data.length === 0 ? (
                        <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                            <span className="mb-4 grid size-16 place-items-center rounded-full bg-moss-50 text-moss-700 dark:bg-moss-950 dark:text-moss-300">
                                <ClipboardList className="size-8" />
                            </span>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-foreground">
                                No queue tasks found
                            </h2>
                            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-muted-foreground">
                                No employees are currently assigned to your
                                queue for this event.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-bold tracking-wide text-slate-500 uppercase dark:bg-muted/40 dark:text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3.5">
                                            Employee
                                        </th>
                                        <th className="px-5 py-3.5">
                                            Employee no.
                                        </th>
                                        <th className="px-5 py-3.5">Task</th>
                                        <th className="px-5 py-3.5">
                                            Queue status
                                        </th>
                                        <th className="px-5 py-3.5 text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-border">
                                    {queues.data.map((queue) => (
                                        <tr
                                            key={queue.id}
                                            className="transition hover:bg-slate-50/70 dark:hover:bg-accent/40"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-moss-50 text-moss-700 dark:bg-moss-950 dark:text-moss-300">
                                                        <UserRound className="size-5" />
                                                    </span>
                                                    <span className="font-bold text-slate-900 dark:text-foreground">
                                                        {employeeName(queue)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 font-medium text-slate-600 dark:text-muted-foreground">
                                                {queue.appointment
                                                    .patient_profile
                                                    ?.employee_number ?? '—'}
                                            </td>
                                            <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">
                                                {taskLabel(queue.service_role)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${queueStatusStyles[queue.status] ?? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-border dark:bg-muted dark:text-muted-foreground'}`}
                                                >
                                                    {queue.status.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {[
                                                    'assigned',
                                                    'in_progress',
                                                ].includes(queue.status) ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            router.visit(
                                                                queueAction(
                                                                    role,
                                                                    queue,
                                                                ),
                                                            )
                                                        }
                                                        className="bg-moss-700 text-white hover:bg-moss-800"
                                                    >
                                                        <Play className="size-4" />
                                                        {queue.status ===
                                                        'in_progress'
                                                            ? 'Continue'
                                                            : 'Start'}
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        No action
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Pagination pagination={queues} label="queue tasks" />
                </section>
            </main>
        </AppLayout>
    );
}
