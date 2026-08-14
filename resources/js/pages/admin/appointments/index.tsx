import type { PageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowDownUp,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    CircleAlert,
    Ellipsis,
    Eye,
    Filter,
    Search,
    Stethoscope,
    UserRound,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: '/admin/appointments' },
];

interface PatientProfile {
    birthdate?: string | null;
    sex?: string | null;
    civil_status?: string | null;
}

interface Person {
    id?: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email?: string;
    contact?: string | null;
    patient_profile?: PatientProfile | null;
}

interface Appointment {
    id: number;
    appointment_date: string;
    start_time: string | null;
    end_time: string | null;
    status: string;
    type: string;
    service_types: string[] | string | null;
    referral_code?: string | null;
    notes?: string | null;
    batch_id?: string | null;
    user: Person;
    company: { id: number; company_name: string } | null;
    doctor: Person | null;
}

interface Filters {
    search: string;
    status: string;
    type: string;
    date_filter: string;
    date_from: string;
    date_to: string;
    doctor_id: string | number;
    company_id: string | number;
    sort: string;
    direction: string;
}

interface OptionRecord {
    id: number;
    first_name: string;
    last_name: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props extends PageProps {
    appointments: {
        data: Appointment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from?: number | null;
        to?: number | null;
        first_page_url?: string;
        last_page_url?: string;
        next_page_url?: string | null;
        prev_page_url?: string | null;
        links: PaginationLink[];
    };
    filters: Filters;
    doctors: OptionRecord[];
    companies: Array<{ id: number; company_name: string }>;
    statusOptions: string[];
    typeOptions: Record<string, string>;
    bulkOnly: boolean;
}

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    arrived: 'Arrived',
    for_diagnostics: 'For Diagnostics',
    for_xray: 'For X-Ray',
    for_final_evaluation: 'For Final Evaluation',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const statusStyles: Record<string, string> = {
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    accepted: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    arrived: 'border-blue-200 bg-blue-50 text-blue-700',
    for_diagnostics: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    for_xray: 'border-violet-200 bg-violet-50 text-violet-700',
    for_final_evaluation: 'border-purple-200 bg-purple-50 text-purple-700',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cancelled: 'border-red-200 bg-red-50 text-red-700',
};

const typeLabels: Record<string, string> = {
    individual: 'Individual',
    walk_in: 'Walk-in',
    company_referral: 'Company Referral',
    company_bulk: 'Company Bulk',
};

function fullName(person: Person): string {
    return [person.first_name, person.middle_name, person.last_name]
        .filter(Boolean)
        .join(' ');
}

function servicesFor(appointment: Appointment): string[] {
    if (Array.isArray(appointment.service_types)) {
        return appointment.service_types;
    }
    if (typeof appointment.service_types === 'string') {
        try {
            const decoded: unknown = JSON.parse(appointment.service_types);
            return Array.isArray(decoded)
                ? decoded.filter(
                      (item): item is string => typeof item === 'string',
                  )
                : [appointment.service_types];
        } catch {
            return [appointment.service_types];
        }
    }
    return [];
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function formatTime(value: string | null): string | null {
    if (!value) return null;
    const match = value.match(/(\d{2}):(\d{2})/);
    if (!match) return value;
    const date = new Date();
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function appointmentTime(appointment: Appointment): string {
    const start = formatTime(appointment.start_time);
    const end = formatTime(appointment.end_time);
    if (start && end) return `${start} – ${end}`;
    return start ?? 'Time not assigned';
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${statusStyles[status] ?? 'border-slate-200 bg-slate-50 text-slate-600'}`}
        >
            {statusLabels[status] ?? status.replaceAll('_', ' ')}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    return (
        <span className="inline-flex rounded-full border border-moss-200 bg-moss-50 px-2.5 py-1 text-[11px] font-semibold text-moss-700">
            {typeLabels[type] ?? type.replaceAll('_', ' ')}
        </span>
    );
}

export default function AdminAppointmentsIndex() {
    const {
        appointments,
        filters,
        doctors,
        companies,
        statusOptions,
        typeOptions,
        bulkOnly,
    } = usePage<Props>().props;
    const endpoint = bulkOnly
        ? '/admin/bulk-appointments'
        : '/admin/appointments';
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const visit = (next: Partial<Filters>) => {
        setLoading(true);
        router.get(
            endpoint,
            { ...filters, ...next, per_page: appointments.per_page, page: 1 },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
    };

    useEffect(() => {
        if (search === filters.search) return;
        const timeout = window.setTimeout(() => visit({ search }), 400);
        return () => window.clearTimeout(timeout);
        // `visit` intentionally uses the latest server filters after each visit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filters.search]);

    const clearFilters = () => {
        setSearch('');
        setLoading(true);
        router.get(
            endpoint,
            { per_page: appointments.per_page },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
    };

    const updateStatus = (appointment: Appointment, status: string) => {
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
    };

    const missingFields = (appointment: Appointment): string[] => {
        if (appointment.type !== 'individual') return [];
        const missing: string[] = [];
        if (!appointment.user.patient_profile?.birthdate)
            missing.push('Birthdate');
        if (!appointment.user.patient_profile?.sex) missing.push('Sex');
        if (!appointment.user.contact) missing.push('Contact number');
        return missing;
    };

    const hasFilters = Object.entries(filters).some(
        ([key, value]) => key !== 'direction' && value !== '' && value !== null,
    );
    const sortValue = filters.sort
        ? `${filters.sort}:${filters.direction || 'asc'}`
        : '';

    const appointmentActions = (appointment: Appointment) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={`Actions for ${fullName(appointment.user)}`}
                    className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                    <Ellipsis className="size-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    onSelect={() => setSelectedAppointment(appointment)}
                >
                    <Eye className="size-4" /> View details
                </DropdownMenuItem>
                {appointment.status === 'pending' && (
                    <DropdownMenuItem
                        disabled={missingFields(appointment).length > 0}
                        onSelect={() => updateStatus(appointment, 'accepted')}
                    >
                        <CheckCircle2 className="size-4" /> Accept appointment
                    </DropdownMenuItem>
                )}
                {!['completed', 'cancelled'].includes(appointment.status) && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onSelect={() =>
                                updateStatus(appointment, 'cancelled')
                            }
                        >
                            <XCircle className="size-4" /> Cancel appointment
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <>
            <Head title={bulkOnly ? 'Company Bulk Requests' : 'Appointments'} />
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[.14em] text-moss-600 uppercase">
                            Appointment management
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-[-.03em] text-slate-950 sm:text-3xl">
                            {bulkOnly
                                ? 'Company Bulk Requests'
                                : 'Appointments'}
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {bulkOnly
                                ? 'Review and coordinate company bulk appointment requests.'
                                : 'Search, filter, and manage real patient appointments and workflow status.'}
                        </p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-600 shadow-sm">
                        <CalendarDays className="size-4 text-moss-600" />
                        {appointments.total.toLocaleString()} total
                    </div>
                </header>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative min-w-0 flex-1">
                            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                maxLength={100}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search patient, company, doctor, or referral code..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-moss-500 focus:ring-4 focus:ring-moss-500/10"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Filter className="size-4" />
                            Server-side filters
                            {loading && (
                                <span className="size-3.5 animate-spin rounded-full border-2 border-moss-200 border-t-moss-700" />
                            )}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                        <FilterSelect
                            label="Date"
                            value={filters.date_filter}
                            onChange={(value) => visit({ date_filter: value })}
                            options={[
                                ['', 'All dates'],
                                ['today', 'Today'],
                                ['upcoming', 'Upcoming'],
                            ]}
                        />
                        <FilterSelect
                            label="Status"
                            value={filters.status}
                            onChange={(value) => visit({ status: value })}
                            options={[
                                ['', 'All statuses'],
                                ...statusOptions.map(
                                    (status) =>
                                        [status, statusLabels[status]] as [
                                            string,
                                            string,
                                        ],
                                ),
                            ]}
                        />
                        {!bulkOnly && (
                            <FilterSelect
                                label="Type"
                                value={filters.type}
                                onChange={(value) => visit({ type: value })}
                                options={[
                                    ['', 'All types'],
                                    ...Object.entries(typeOptions),
                                ]}
                            />
                        )}
                        <FilterSelect
                            label="Doctor"
                            value={String(filters.doctor_id)}
                            onChange={(value) => visit({ doctor_id: value })}
                            options={[
                                ['', 'All doctors'],
                                ...doctors.map(
                                    (doctor) =>
                                        [
                                            String(doctor.id),
                                            `Dr. ${doctor.first_name} ${doctor.last_name}`,
                                        ] as [string, string],
                                ),
                            ]}
                        />
                        <FilterSelect
                            label="Company"
                            value={String(filters.company_id)}
                            onChange={(value) => visit({ company_id: value })}
                            options={[
                                ['', 'All companies'],
                                ...companies.map(
                                    (company) =>
                                        [
                                            String(company.id),
                                            company.company_name,
                                        ] as [string, string],
                                ),
                            ]}
                        />
                        <FilterSelect
                            label="Sort"
                            value={sortValue}
                            onChange={(value) => {
                                const [sort = '', direction = 'asc'] =
                                    value.split(':');
                                visit({ sort, direction });
                            }}
                            icon={<ArrowDownUp className="size-3.5" />}
                            options={[
                                ['', 'Workflow priority'],
                                ['appointment_date:asc', 'Date: earliest'],
                                ['appointment_date:desc', 'Date: latest'],
                                ['created_at:desc', 'Recently created'],
                                ['status:asc', 'Status A–Z'],
                            ]}
                        />
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
                        <label className="text-xs font-medium text-slate-500">
                            From date
                            <input
                                type="date"
                                value={filters.date_from}
                                onChange={(event) =>
                                    visit({ date_from: event.target.value })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700"
                            />
                        </label>
                        <label className="text-xs font-medium text-slate-500">
                            To date
                            <input
                                type="date"
                                min={filters.date_from || undefined}
                                value={filters.date_to}
                                onChange={(event) =>
                                    visit({ date_to: event.target.value })
                                }
                                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700"
                            />
                        </label>
                    </div>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-moss-700"
                        >
                            <X className="size-3.5" /> Clear all filters
                        </button>
                    )}
                </section>

                <section
                    className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}
                    aria-busy={loading}
                >
                    {appointments.data.length > 0 ? (
                        <>
                            <div className="hidden overflow-x-auto lg:block">
                                <table className="w-full min-w-[1100px] text-left">
                                    <thead className="bg-slate-50/90 text-[11px] font-semibold tracking-[.08em] text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-5 py-3.5">
                                                Patient
                                            </th>
                                            <th className="px-5 py-3.5">
                                                Appointment
                                            </th>
                                            <th className="px-5 py-3.5">
                                                Type
                                            </th>
                                            <th className="px-5 py-3.5">
                                                Services
                                            </th>
                                            <th className="px-5 py-3.5">
                                                Doctor
                                            </th>
                                            <th className="px-5 py-3.5">
                                                Status
                                            </th>
                                            <th className="px-5 py-3.5 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {appointments.data.map(
                                            (appointment) => (
                                                <tr
                                                    key={appointment.id}
                                                    className="hover:bg-moss-50/40"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-moss-50 text-xs font-semibold text-moss-700">
                                                                {appointment.user.first_name.charAt(
                                                                    0,
                                                                )}
                                                                {appointment.user.last_name.charAt(
                                                                    0,
                                                                )}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="max-w-48 truncate text-sm font-semibold text-slate-900">
                                                                    {fullName(
                                                                        appointment.user,
                                                                    )}
                                                                </p>
                                                                <p className="mt-0.5 max-w-48 truncate text-[11px] text-slate-500">
                                                                    {appointment.company
                                                                        ? `Company · ${appointment.company.company_name}`
                                                                        : typeLabels[
                                                                                appointment
                                                                                    .type
                                                                            ] ===
                                                                            'Walk-in'
                                                                          ? 'Walk-in patient'
                                                                          : 'Individual patient'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-medium text-slate-800">
                                                            {formatDate(
                                                                appointment.appointment_date,
                                                            )}
                                                        </p>
                                                        <p className="mt-0.5 text-[11px] text-slate-500">
                                                            {appointmentTime(
                                                                appointment,
                                                            )}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <TypeBadge
                                                            type={
                                                                appointment.type
                                                            }
                                                        />
                                                    </td>
                                                    <td className="max-w-64 px-5 py-4">
                                                        <ServiceBadges
                                                            services={servicesFor(
                                                                appointment,
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {appointment.doctor ? (
                                                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                                                <Stethoscope className="size-3.5 text-moss-600" />{' '}
                                                                Dr.{' '}
                                                                {fullName(
                                                                    appointment.doctor,
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">
                                                                Not assigned
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <StatusBadge
                                                            status={
                                                                appointment.status
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        {appointmentActions(
                                                            appointment,
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="divide-y divide-slate-100 lg:hidden">
                                {appointments.data.map((appointment) => (
                                    <article
                                        key={appointment.id}
                                        className="p-4 sm:p-5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {fullName(appointment.user)}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatDate(
                                                        appointment.appointment_date,
                                                    )}{' '}
                                                    ·{' '}
                                                    {appointmentTime(
                                                        appointment,
                                                    )}
                                                </p>
                                            </div>
                                            {appointmentActions(appointment)}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <TypeBadge
                                                type={appointment.type}
                                            />
                                            <StatusBadge
                                                status={appointment.status}
                                            />
                                        </div>
                                        <div className="mt-3">
                                            <ServiceBadges
                                                services={servicesFor(
                                                    appointment,
                                                )}
                                            />
                                        </div>
                                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                                            <span>
                                                {appointment.company
                                                    ?.company_name ??
                                                    'Individual patient'}
                                            </span>
                                            <span>
                                                {appointment.doctor
                                                    ? `Dr. ${fullName(appointment.doctor)}`
                                                    : 'Doctor not assigned'}
                                            </span>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <Pagination
                                pagination={appointments}
                                label="appointments"
                            />
                        </>
                    ) : (
                        <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                            <CalendarDays className="size-10 text-slate-300" />
                            <h2 className="mt-4 text-base font-semibold text-slate-800">
                                No appointments found
                            </h2>
                            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                                No appointments match your current search or
                                filters.
                            </p>
                            {hasFilters && (
                                <Button
                                    variant="outline"
                                    className="mt-5"
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    )}
                </section>
            </div>

            <Dialog
                open={selectedAppointment !== null}
                onOpenChange={(open) => !open && setSelectedAppointment(null)}
            >
                {selectedAppointment && (
                    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Appointment Details</DialogTitle>
                            <DialogDescription>
                                Appointment #{selectedAppointment.id} · Current
                                scheduling and coordination information
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <DetailCard
                                icon={UserRound}
                                label="Patient"
                                value={fullName(selectedAppointment.user)}
                                detail={selectedAppointment.user.email}
                            />
                            <DetailCard
                                icon={CalendarDays}
                                label="Schedule"
                                value={formatDate(
                                    selectedAppointment.appointment_date,
                                )}
                                detail={appointmentTime(selectedAppointment)}
                            />
                            <DetailCard
                                icon={Building2}
                                label="Company"
                                value={
                                    selectedAppointment.company?.company_name ??
                                    'Not company-linked'
                                }
                                detail={
                                    selectedAppointment.referral_code
                                        ? `Referral: ${selectedAppointment.referral_code}`
                                        : undefined
                                }
                            />
                            <DetailCard
                                icon={Stethoscope}
                                label="Assigned doctor"
                                value={
                                    selectedAppointment.doctor
                                        ? `Dr. ${fullName(selectedAppointment.doctor)}`
                                        : 'Not assigned'
                                }
                            />
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <TypeBadge type={selectedAppointment.type} />
                                <StatusBadge
                                    status={selectedAppointment.status}
                                />
                                {selectedAppointment.batch_id && (
                                    <span className="text-xs text-slate-500">
                                        Batch {selectedAppointment.batch_id}
                                    </span>
                                )}
                            </div>
                            <p className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                Requested services
                            </p>
                            <div className="mt-2">
                                <ServiceBadges
                                    services={servicesFor(selectedAppointment)}
                                />
                            </div>
                            {selectedAppointment.notes && (
                                <>
                                    <p className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                        Administrative notes
                                    </p>
                                    <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-slate-600">
                                        {selectedAppointment.notes}
                                    </p>
                                </>
                            )}
                        </div>

                        {missingFields(selectedAppointment).length > 0 && (
                            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                                <div>
                                    <p className="font-semibold">
                                        Patient profile incomplete
                                    </p>
                                    <p className="mt-1 text-xs leading-5">
                                        Complete{' '}
                                        {missingFields(
                                            selectedAppointment,
                                        ).join(', ')}{' '}
                                        before accepting this individual
                                        appointment.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedAppointment(null)}
                            >
                                Close
                            </Button>
                            {!['completed', 'cancelled'].includes(
                                selectedAppointment.status,
                            ) && (
                                <Button
                                    variant="destructive"
                                    disabled={
                                        updatingId === selectedAppointment.id
                                    }
                                    onClick={() =>
                                        updateStatus(
                                            selectedAppointment,
                                            'cancelled',
                                        )
                                    }
                                >
                                    Cancel Appointment
                                </Button>
                            )}
                            {selectedAppointment.status === 'pending' && (
                                <Button
                                    disabled={
                                        missingFields(selectedAppointment)
                                            .length > 0 ||
                                        updatingId === selectedAppointment.id
                                    }
                                    onClick={() =>
                                        updateStatus(
                                            selectedAppointment,
                                            'accepted',
                                        )
                                    }
                                    className="bg-moss-700 text-white hover:bg-moss-800"
                                >
                                    Accept Appointment
                                </Button>
                            )}
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
}

function FilterSelect({
    label,
    value,
    options,
    onChange,
    icon,
}: {
    label: string;
    value: string;
    options: Array<[string, string]>;
    onChange: (value: string) => void;
    icon?: React.ReactNode;
}) {
    return (
        <label className="relative text-xs font-medium text-slate-500">
            {label}
            <div className="relative mt-1.5">
                {icon && (
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
                        {icon}
                    </span>
                )}
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className={`h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pr-8 text-sm text-slate-700 outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/10 ${icon ? 'pl-9' : 'pl-3'}`}
                >
                    {options.map(([optionValue, optionLabel]) => (
                        <option
                            key={`${label}-${optionValue}`}
                            value={optionValue}
                        >
                            {optionLabel}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
            </div>
        </label>
    );
}

function ServiceBadges({ services }: { services: string[] }) {
    if (services.length === 0) {
        return (
            <span className="text-xs text-slate-400">No services listed</span>
        );
    }
    return (
        <div className="flex flex-wrap gap-1.5">
            {services.slice(0, 3).map((service) => (
                <span
                    key={service}
                    className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600"
                >
                    {service}
                </span>
            ))}
            {services.length > 3 && (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                    +{services.length - 3}
                </span>
            )}
        </div>
    );
}

function DetailCard({
    icon: Icon,
    label,
    value,
    detail,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    detail?: string;
}) {
    return (
        <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-moss-700 shadow-sm">
                <Icon className="size-4" />
            </span>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                    {label}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                    {value}
                </p>
                {detail && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                        {detail}
                    </p>
                )}
            </div>
        </div>
    );
}

AdminAppointmentsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
