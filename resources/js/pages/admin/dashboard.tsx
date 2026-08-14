import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    BarChart3,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    FileBarChart,
    FlaskConical,
    Stethoscope,
    UserCog,
    Users,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: '/admin/dashboard' },
];

interface AppointmentData {
    id: number;
    appointment_date: string;
    status: string;
    type: string;
    service_type?: string;
    service_types?: string[];
    user: {
        first_name: string;
        last_name: string;
    };
    company: {
        company_name: string;
    } | null;
}

interface DashboardStats {
    totalStaff: number;
    totalCompanies: number;
    totalPatients: number;
    todayAppointments: number;
    weekAppointments: number;
    monthAppointments: number;
    completedAppointments: number;
    pendingAppointments: number;
    totalLabResults: number;
    totalPhysicalExams: number;
    totalXrayReports: number;
}

interface DashboardProps {
    stats?: Partial<DashboardStats>;
    recentAppointments?: AppointmentData[];
    todayAppointments?: AppointmentData[];
    appointmentsByStatus?: Record<string, number>;
    appointmentsByType?: Record<string, number>;
    [key: string]: unknown;
}

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Scheduled',
    arrived: 'Arrived',
    for_physical_examination: 'Physical exam',
    for_diagnostics: 'Diagnostics',
    for_xray: 'X-ray',
    awaiting_xray_result: 'Awaiting X-ray',
    for_final_evaluation: 'Final evaluation',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const statusColors: Record<string, string> = {
    pending: '#d97706',
    accepted: '#6b8f71',
    arrived: '#2563eb',
    for_physical_examination: '#7c3aed',
    for_diagnostics: '#0891b2',
    for_xray: '#4f46e5',
    awaiting_xray_result: '#6366f1',
    for_final_evaluation: '#9333ea',
    completed: '#15803d',
    cancelled: '#dc2626',
};

function humanize(value: string): string {
    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAppointmentDate(date: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: 'border-amber-200 bg-amber-50 text-amber-700',
        accepted: 'border-moss-200 bg-moss-50 text-moss-700',
        arrived: 'border-blue-200 bg-blue-50 text-blue-700',
        completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        cancelled: 'border-red-200 bg-red-50 text-red-700',
    };

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status] ?? 'border-slate-200 bg-slate-50 text-slate-600'}`}
        >
            {statusLabels[status] ?? humanize(status)}
        </span>
    );
}

function SectionHeader({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-sm font-semibold text-slate-900">
                    {title}
                </h2>
                {description && (
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

export default function AdminDashboard() {
    const {
        stats = {},
        recentAppointments = [],
        todayAppointments = [],
        appointmentsByStatus = {},
        appointmentsByType = {},
    } = usePage<DashboardProps>().props;

    const count = (value: number | undefined) => Number(value ?? 0);
    const statusCount = (status: string) =>
        Number(appointmentsByStatus[status] ?? 0);
    const totalAppointments = Object.values(appointmentsByStatus).reduce(
        (total, value) => total + Number(value),
        0,
    );
    const completed = statusCount('completed');
    const pending = statusCount('pending');
    const cancelled = statusCount('cancelled');
    const inProgress = Math.max(
        0,
        totalAppointments - completed - pending - cancelled,
    );

    const statusData = Object.entries(appointmentsByStatus)
        .map(([status, value]) => ({
            status,
            label: statusLabels[status] ?? humanize(status),
            count: Number(value),
        }))
        .sort((a, b) => b.count - a.count);

    const attentionItems = [
        {
            label: 'Pending appointments',
            count: pending,
            href: '/admin/appointments?status=pending',
            icon: Clock3,
        },
        {
            label: 'Awaiting final evaluation',
            count: statusCount('for_final_evaluation'),
            href: '/admin/appointments?status=for_final_evaluation',
            icon: Stethoscope,
        },
        {
            label: 'In diagnostics',
            count: statusCount('for_diagnostics'),
            href: '/admin/appointments?status=for_diagnostics',
            icon: FlaskConical,
        },
    ].filter((item) => item.count > 0);

    const companyActivity = [...todayAppointments, ...recentAppointments]
        .filter((appointment) => appointment.company)
        .filter(
            (appointment, index, appointments) =>
                appointments.findIndex((item) => item.id === appointment.id) ===
                index,
        )
        .slice(0, 4);

    const kpis = [
        {
            label: "Today's appointments",
            value: count(stats.todayAppointments),
            detail: 'Scheduled for the current day',
            icon: CalendarDays,
        },
        {
            label: 'Pending appointments',
            value: count(stats.pendingAppointments),
            detail: 'Awaiting confirmation or action',
            icon: Clock3,
        },
        {
            label: 'Registered patients',
            value: count(stats.totalPatients),
            detail: 'Patient accounts in the system',
            icon: Users,
        },
        {
            label: 'Partner companies',
            value: count(stats.totalCompanies),
            detail: 'Company accounts managed',
            icon: Building2,
        },
    ];

    const quickActions = [
        {
            label: 'Appointments',
            href: '/admin/appointments',
            icon: CalendarDays,
        },
        { label: 'Manage staff', href: '/admin/staff', icon: UserCog },
        { label: 'Companies', href: '/admin/companies', icon: Building2 },
        { label: 'Reports', href: '/admin/reports', icon: FileBarChart },
    ];

    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[.14em] text-moss-600 uppercase">
                            Clinic operations
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-[-.03em] text-slate-950 sm:text-3xl">
                            Admin Dashboard
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Monitor appointments, patient activity, service
                            progress, and clinic performance.
                        </p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-600 shadow-sm">
                        <CalendarDays className="size-4 text-moss-600" />
                        {new Intl.DateTimeFormat('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        }).format(new Date())}
                    </div>
                </header>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {kpis.map(({ label, value, detail, icon: Icon }) => (
                        <article
                            key={label}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-medium text-slate-500">
                                        {label}
                                    </p>
                                    <p className="mt-2 text-3xl font-semibold tracking-[-.04em] text-slate-950">
                                        {value.toLocaleString()}
                                    </p>
                                </div>
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-moss-50 text-moss-700">
                                    <Icon className="size-[18px]" />
                                </span>
                            </div>
                            <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-4 text-slate-400">
                                {detail}
                            </p>
                        </article>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
                    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <SectionHeader
                            title="Appointment Overview"
                            description="Distribution across all recorded appointment statuses"
                            action={
                                <Link
                                    href="/admin/appointments"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-moss-700 hover:text-moss-800"
                                >
                                    View appointments
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            }
                        />
                        <div className="p-4 sm:p-5">
                            {statusData.length > 0 ? (
                                <div className="h-[310px] w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={statusData}
                                            layout="vertical"
                                            margin={{
                                                top: 4,
                                                right: 16,
                                                bottom: 4,
                                                left: 8,
                                            }}
                                        >
                                            <CartesianGrid
                                                horizontal={false}
                                                stroke="#e2e8f0"
                                                strokeDasharray="3 3"
                                            />
                                            <XAxis
                                                type="number"
                                                allowDecimals={false}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fill: '#94a3b8',
                                                    fontSize: 11,
                                                }}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="label"
                                                width={112}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fill: '#475569',
                                                    fontSize: 11,
                                                }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                formatter={(value) => [
                                                    Number(
                                                        value,
                                                    ).toLocaleString(),
                                                    'Appointments',
                                                ]}
                                                contentStyle={{
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 12,
                                                    boxShadow:
                                                        '0 8px 24px rgba(15,23,42,.08)',
                                                }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                radius={[0, 6, 6, 0]}
                                                maxBarSize={22}
                                            >
                                                {statusData.map((entry) => (
                                                    <Cell
                                                        key={entry.status}
                                                        fill={
                                                            statusColors[
                                                                entry.status
                                                            ] ?? '#6b8f71'
                                                        }
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                                    <CalendarDays className="size-8 text-slate-300" />
                                    <p className="mt-3 text-sm font-medium text-slate-700">
                                        No appointment data available
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Status activity will appear here once
                                        appointments are recorded.
                                    </p>
                                </div>
                            )}
                        </div>
                    </article>

                    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <SectionHeader
                            title="Service Completion"
                            description="Overall appointment progress"
                        />
                        <div className="p-5">
                            <div className="space-y-5">
                                {[
                                    {
                                        label: 'Completed',
                                        value: completed,
                                        color: 'bg-emerald-500',
                                    },
                                    {
                                        label: 'In progress',
                                        value: inProgress,
                                        color: 'bg-moss-500',
                                    },
                                    {
                                        label: 'Pending',
                                        value: pending,
                                        color: 'bg-amber-500',
                                    },
                                ].map((entry) => {
                                    const percentage = totalAppointments
                                        ? Math.round(
                                              (entry.value /
                                                  totalAppointments) *
                                                  100,
                                          )
                                        : 0;

                                    return (
                                        <div key={entry.label}>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-slate-600">
                                                    {entry.label}
                                                </span>
                                                <span className="font-semibold text-slate-900">
                                                    {entry.value.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={`h-full rounded-full ${entry.color}`}
                                                    style={{
                                                        width: `${percentage}%`,
                                                    }}
                                                />
                                            </div>
                                            <p className="mt-1 text-right text-[10px] text-slate-400">
                                                {percentage}% of recorded
                                                appointments
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 text-center">
                                {[
                                    [
                                        'Physical exams',
                                        stats.totalPhysicalExams,
                                    ],
                                    ['Lab results', stats.totalLabResults],
                                    ['X-ray reports', stats.totalXrayReports],
                                ].map(([label, value]) => (
                                    <div key={String(label)}>
                                        <p className="text-lg font-semibold text-slate-900">
                                            {count(
                                                value as number | undefined,
                                            ).toLocaleString()}
                                        </p>
                                        <p className="mt-1 text-[10px] leading-4 text-slate-400">
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </article>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.8fr)]">
                    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <SectionHeader
                            title="Today's Clinic Activity"
                            description={`${count(stats.todayAppointments)} appointment${count(stats.todayAppointments) === 1 ? '' : 's'} scheduled today`}
                            action={
                                <Link
                                    href="/admin/appointments"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-moss-700"
                                >
                                    View all <ArrowRight className="size-3.5" />
                                </Link>
                            }
                        />
                        <div className="divide-y divide-slate-100">
                            {todayAppointments.length > 0 ? (
                                todayAppointments
                                    .slice(0, 6)
                                    .map((appointment) => (
                                        <div
                                            key={appointment.id}
                                            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-moss-700">
                                                    {appointment.user.first_name.charAt(
                                                        0,
                                                    )}
                                                    {appointment.user.last_name.charAt(
                                                        0,
                                                    )}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                        {
                                                            appointment.user
                                                                .first_name
                                                        }{' '}
                                                        {
                                                            appointment.user
                                                                .last_name
                                                        }
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        {formatAppointmentDate(
                                                            appointment.appointment_date,
                                                        )}{' '}
                                                        ·{' '}
                                                        {humanize(
                                                            appointment.type,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <StatusBadge
                                                status={appointment.status}
                                            />
                                        </div>
                                    ))
                            ) : (
                                <div className="px-5 py-12 text-center">
                                    <CalendarDays className="mx-auto size-8 text-slate-300" />
                                    <p className="mt-3 text-sm font-medium text-slate-700">
                                        No appointments today
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        There are no appointments scheduled for
                                        today.
                                    </p>
                                </div>
                            )}
                        </div>
                    </article>

                    <div className="space-y-6">
                        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <SectionHeader title="Needs Attention" />
                            <div className="p-4">
                                {attentionItems.length > 0 ? (
                                    <div className="space-y-2">
                                        {attentionItems.map(
                                            ({
                                                label,
                                                count: itemCount,
                                                href,
                                                icon: Icon,
                                            }) => (
                                                <Link
                                                    key={label}
                                                    href={href}
                                                    className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3 transition hover:border-amber-200"
                                                >
                                                    <span className="flex size-9 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
                                                        <Icon className="size-4" />
                                                    </span>
                                                    <span className="min-w-0 flex-1 text-xs font-medium text-slate-700">
                                                        {label}
                                                    </span>
                                                    <span className="text-sm font-semibold text-amber-800">
                                                        {itemCount}
                                                    </span>
                                                </Link>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-5 text-center">
                                        <CheckCircle2 className="mx-auto size-7 text-emerald-500" />
                                        <p className="mt-2 text-sm font-medium text-slate-700">
                                            No items require attention
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Current appointment workflows are
                                            clear.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </article>

                        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <SectionHeader title="Quick Actions" />
                            <div className="grid grid-cols-2 gap-2 p-4">
                                {quickActions.map(
                                    ({ label, href, icon: Icon }) => (
                                        <Link
                                            key={label}
                                            href={href}
                                            className="flex min-h-20 flex-col justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-600 transition hover:border-moss-300 hover:bg-moss-50 hover:text-moss-700"
                                        >
                                            <Icon className="size-[18px] text-moss-600" />
                                            {label}
                                        </Link>
                                    ),
                                )}
                            </div>
                        </article>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <SectionHeader
                            title="Recent Active Appointments"
                            description="Latest non-completed appointment records"
                        />
                        <div className="divide-y divide-slate-100">
                            {recentAppointments.length > 0 ? (
                                recentAppointments
                                    .slice(0, 5)
                                    .map((appointment) => (
                                        <div
                                            key={appointment.id}
                                            className="flex items-center justify-between gap-3 px-5 py-3.5"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-slate-800">
                                                    {
                                                        appointment.user
                                                            .first_name
                                                    }{' '}
                                                    {appointment.user.last_name}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-400">
                                                    {formatAppointmentDate(
                                                        appointment.appointment_date,
                                                    )}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                status={appointment.status}
                                            />
                                        </div>
                                    ))
                            ) : (
                                <p className="px-5 py-10 text-center text-sm text-slate-400">
                                    No active appointments available.
                                </p>
                            )}
                        </div>
                    </article>

                    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <SectionHeader
                            title="Company Appointment Activity"
                            description="Company-linked records in the current overview"
                        />
                        <div className="divide-y divide-slate-100">
                            {companyActivity.length > 0 ? (
                                companyActivity.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-center gap-3 px-5 py-4"
                                    >
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-moss-50 text-moss-700">
                                            <Building2 className="size-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-800">
                                                {
                                                    appointment.company
                                                        ?.company_name
                                                }
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-400">
                                                {formatAppointmentDate(
                                                    appointment.appointment_date,
                                                )}{' '}
                                                · {humanize(appointment.type)}
                                            </p>
                                        </div>
                                        <StatusBadge
                                            status={appointment.status}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="px-5 py-10 text-center">
                                    <Building2 className="mx-auto size-7 text-slate-300" />
                                    <p className="mt-2 text-sm text-slate-500">
                                        No current company appointment activity.
                                    </p>
                                </div>
                            )}
                        </div>
                    </article>

                    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2 xl:col-span-1">
                        <SectionHeader title="Patient Volume & Analytics" />
                        <div className="p-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-moss-50 p-4">
                                    <Activity className="size-4 text-moss-700" />
                                    <p className="mt-4 text-2xl font-semibold text-slate-900">
                                        {count(
                                            stats.weekAppointments,
                                        ).toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Appointments this week
                                    </p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <BarChart3 className="size-4 text-slate-600" />
                                    <p className="mt-4 text-2xl font-semibold text-slate-900">
                                        {count(
                                            stats.monthAppointments,
                                        ).toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Appointments this month
                                    </p>
                                </div>
                            </div>
                            <p className="mt-4 text-xs leading-5 text-slate-500">
                                Open the analytics workspace for monthly trends,
                                service breakdowns, and forecasting tools.
                            </p>
                            <Link
                                href="/admin/analytics"
                                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-moss-700 px-4 text-xs font-semibold text-white hover:bg-moss-800"
                            >
                                View Full Analytics
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </article>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-moss-50 text-moss-700">
                                <ClipboardCheck className="size-[18px]" />
                            </span>
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Appointment Type Mix
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Current distribution by booking source
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(appointmentsByType).length > 0 ? (
                                Object.entries(appointmentsByType).map(
                                    ([type, value]) => (
                                        <span
                                            key={type}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                                        >
                                            {humanize(type)}
                                            <strong className="text-slate-900">
                                                {Number(value).toLocaleString()}
                                            </strong>
                                        </span>
                                    ),
                                )
                            ) : (
                                <span className="text-xs text-slate-400">
                                    No appointment type data available.
                                </span>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

AdminDashboard.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
