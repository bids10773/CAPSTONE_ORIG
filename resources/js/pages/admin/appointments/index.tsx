import type { PageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Cake,
    CalendarDays,
    CheckCircle2,
    CircleAlert,
    Ellipsis,
    Eye,
    HeartHandshake,
    Phone,
    Search,
    Stethoscope,
    UserRound,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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
import { appointmentStatusLabels as statusLabels } from '@/lib/appointment-status';
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
    created_at: string;
    rejection_reason?: string | null;
    rejection_details?: string | null;
    batch_id?: string | null;
    expected_employee_count?: number | null;
    bulk_employees_count?: number;
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
    pendingRequestsCount: number;
}

const statusStyles: Record<string, string> = {
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    accepted: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    arrived: 'border-blue-200 bg-blue-50 text-blue-700',
    for_diagnostics: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    for_xray: 'border-violet-200 bg-violet-50 text-violet-700',
    for_final_evaluation: 'border-purple-200 bg-purple-50 text-purple-700',
    awaiting_xray_result: 'border-amber-200 bg-amber-50 text-amber-700',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rejected: 'border-rose-200 bg-rose-50 text-rose-700',
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

function calculateAge(birthdate?: string | null): number | null {
    if (!birthdate) return null;
    const [year, month, day] = birthdate.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return null;

    const today = new Date();
    let age = today.getFullYear() - year;
    if (
        today.getMonth() + 1 < month ||
        (today.getMonth() + 1 === month && today.getDate() < day)
    ) {
        age -= 1;
    }

    return age;
}

function formatProfileValue(value: string): string {
    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
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

function isPastAppointment(appointment: Appointment): boolean {
    const appointmentDate = appointment.appointment_date.slice(0, 10);

    // Bulk company events intentionally have no individual time slot. Keep a
    // pending event confirmable for the whole scheduled day and only consider
    // it past once its calendar date has elapsed.
    if (appointment.type === 'company_bulk' || !appointment.start_time) {
        const now = new Date();
        const today = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
        ].join('-');

        return appointmentDate < today;
    }

    return (
        new Date(
            `${appointmentDate}T${appointment.start_time.slice(0, 5)}:00`,
        ).getTime() < Date.now()
    );
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
    const { appointments, filters, bulkOnly, pendingRequestsCount } =
        usePage<Props>().props;
    const endpoint = bulkOnly
        ? '/admin/bulk-appointments'
        : '/admin/appointments';
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const lastServerSearch = useRef(filters.search ?? '');
    const suppressSearchVisit = useRef(false);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [rejectingAppointment, setRejectingAppointment] =
        useState<Appointment | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionDetails, setRejectionDetails] = useState('');
    const [rejectionError, setRejectionError] = useState('');

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
        if (suppressSearchVisit.current) {
            suppressSearchVisit.current = false;
            return;
        }
        if (search === filters.search) return;
        const timeout = window.setTimeout(() => {
            setLoading(true);
            router.get(
                endpoint,
                { search, per_page: appointments.per_page },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onFinish: () => setLoading(false),
                },
            );
        }, 400);
        return () => window.clearTimeout(timeout);
        // `visit` intentionally uses the latest server filters after each visit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filters.search]);

    useEffect(() => {
        if (lastServerSearch.current === filters.search) return;
        lastServerSearch.current = filters.search;
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const clearSearch = () => {
        if (search !== '') suppressSearchVisit.current = true;
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

    const approve = (appointment: Appointment) => {
        setUpdatingId(appointment.id);
        router.patch(
            `/admin/appointments/${appointment.id}/approve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setSelectedAppointment(null),
                onError: (errors) =>
                    toast.error(
                        String(
                            Object.values(errors)[0] ??
                                'Unable to confirm this appointment.',
                        ),
                    ),
                onFinish: () => setUpdatingId(null),
            },
        );
    };

    const openReject = (appointment: Appointment) => {
        setRejectionReason('');
        setRejectionDetails('');
        setRejectionError('');
        setRejectingAppointment(appointment);
    };

    const reject = () => {
        if (
            !rejectingAppointment ||
            !rejectionReason ||
            (rejectionReason === 'other' && !rejectionDetails.trim())
        ) {
            setRejectionError(
                'Select a reason and provide details when required.',
            );
            return;
        }
        setUpdatingId(rejectingAppointment.id);
        router.patch(
            `/admin/appointments/${rejectingAppointment.id}/reject`,
            {
                reason: rejectionReason,
                details: rejectionDetails,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejectingAppointment(null);
                    setSelectedAppointment(null);
                },
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
                {appointment.type === 'company_bulk' && bulkOnly && (
                    <DropdownMenuItem
                        onSelect={() =>
                            router.visit(
                                `/admin/onsite-events/${appointment.id}`,
                            )
                        }
                    >
                        <Building2 className="size-4" /> Review masterlist
                    </DropdownMenuItem>
                )}
                {appointment.status === 'pending' && !bulkOnly && (
                    <DropdownMenuItem
                        disabled={
                            missingFields(appointment).length > 0 ||
                            isPastAppointment(appointment)
                        }
                        onSelect={() =>
                            appointment.type === 'individual'
                                ? approve(appointment)
                                : updateStatus(appointment, 'accepted')
                        }
                    >
                        <CheckCircle2 className="size-4" /> Confirm request
                    </DropdownMenuItem>
                )}
                {appointment.status === 'pending' &&
                    appointment.type === 'individual' && (
                        <DropdownMenuItem
                            className="text-red-600"
                            onSelect={() => openReject(appointment)}
                        >
                            <XCircle className="size-4" /> Reject request
                        </DropdownMenuItem>
                    )}
                {!['pending', 'completed', 'cancelled', 'rejected'].includes(
                    appointment.status,
                ) && (
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
                        {appointments.total.toLocaleString()}{' '}
                        {filters.search ? 'matching' : 'total'}
                    </div>
                </header>

                {!bulkOnly && pendingRequestsCount > 0 && (
                    <button
                        type="button"
                        onClick={() =>
                            visit({ status: 'pending', type: 'individual' })
                        }
                        className="flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-amber-900 shadow-sm"
                    >
                        <span>
                            <strong>
                                {pendingRequestsCount} appointment{' '}
                                {pendingRequestsCount === 1
                                    ? 'request'
                                    : 'requests'}
                            </strong>
                            <span className="mt-1 block text-sm text-amber-700">
                                Waiting for administrator review
                            </span>
                        </span>
                        <ArrowRight className="size-5" />
                    </button>
                )}

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
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-11 pl-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-moss-500 focus:ring-4 focus:ring-moss-500/10"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    aria-label="Clear search"
                                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            Search appointments
                            {loading && (
                                <span className="size-3.5 animate-spin rounded-full border-2 border-moss-200 border-t-moss-700" />
                            )}
                        </div>
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
                                {filters.search
                                    ? 'No appointments found'
                                    : filters.date_filter === 'today'
                                      ? 'No appointments today'
                                      : 'No appointments found'}
                            </h2>
                            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                                {filters.search
                                    ? `No appointments match “${filters.search}”.`
                                    : filters.date_filter === 'today'
                                      ? 'There are no appointments scheduled for today that match the selected filters.'
                                      : 'No appointments match your current filters.'}
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

                        <section>
                            <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                Patient information
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <DetailCard
                                    icon={UserRound}
                                    label="Patient"
                                    value={fullName(selectedAppointment.user)}
                                    detail={selectedAppointment.user.email}
                                />
                                <DetailCard
                                    icon={Cake}
                                    label="Age"
                                    value={
                                        calculateAge(
                                            selectedAppointment.user
                                                .patient_profile?.birthdate,
                                        ) !== null
                                            ? `${calculateAge(selectedAppointment.user.patient_profile?.birthdate)} years old`
                                            : 'Not provided'
                                    }
                                    detail={
                                        selectedAppointment.user.patient_profile
                                            ?.birthdate
                                            ? `Born ${formatDate(selectedAppointment.user.patient_profile.birthdate)}`
                                            : undefined
                                    }
                                />
                                <DetailCard
                                    icon={HeartHandshake}
                                    label="Civil status"
                                    value={
                                        selectedAppointment.user.patient_profile
                                            ?.civil_status
                                            ? formatProfileValue(
                                                  selectedAppointment.user
                                                      .patient_profile
                                                      .civil_status,
                                              )
                                            : 'Not provided'
                                    }
                                />
                                <DetailCard
                                    icon={Phone}
                                    label="Contact number"
                                    value={
                                        selectedAppointment.user.contact ||
                                        'Not provided'
                                    }
                                />
                            </div>
                        </section>

                        <section>
                            <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                Appointment information
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <DetailCard
                                    icon={CalendarDays}
                                    label="Schedule"
                                    value={formatDate(
                                        selectedAppointment.appointment_date,
                                    )}
                                    detail={appointmentTime(
                                        selectedAppointment,
                                    )}
                                />
                                <DetailCard
                                    icon={Building2}
                                    label="Company"
                                    value={
                                        selectedAppointment.company
                                            ?.company_name ??
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
                        </section>

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

                        {selectedAppointment.status === 'pending' &&
                            isPastAppointment(selectedAppointment) && (
                                <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                                    <div>
                                        <p className="font-semibold">
                                            {selectedAppointment.start_time
                                                ? 'Appointment time has passed'
                                                : 'Appointment date has passed'}
                                        </p>
                                        <p className="mt-1 text-xs leading-5">
                                            Past requests cannot be confirmed.
                                            Cancel this request and arrange a
                                            future schedule with the requester.
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
                            {![
                                'pending',
                                'completed',
                                'cancelled',
                                'rejected',
                            ].includes(selectedAppointment.status) && (
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
                                <>
                                    {selectedAppointment.type ===
                                        'individual' && (
                                        <Button
                                            variant="destructive"
                                            disabled={
                                                updatingId ===
                                                selectedAppointment.id
                                            }
                                            onClick={() =>
                                                openReject(selectedAppointment)
                                            }
                                        >
                                            Reject Request
                                        </Button>
                                    )}
                                    {selectedAppointment.type ===
                                    'company_bulk' ? (
                                        <Button
                                            onClick={() =>
                                                router.visit(
                                                    `/admin/onsite-events/${selectedAppointment.id}`,
                                                )
                                            }
                                            className="bg-moss-700 text-white hover:bg-moss-800"
                                        >
                                            Review{' '}
                                            {selectedAppointment.bulk_employees_count ??
                                                0}{' '}
                                            employees
                                        </Button>
                                    ) : (
                                        <Button
                                            disabled={
                                                missingFields(
                                                    selectedAppointment,
                                                ).length > 0 ||
                                                isPastAppointment(
                                                    selectedAppointment,
                                                ) ||
                                                updatingId ===
                                                    selectedAppointment.id
                                            }
                                            onClick={() =>
                                                selectedAppointment.type ===
                                                'individual'
                                                    ? approve(
                                                          selectedAppointment,
                                                      )
                                                    : updateStatus(
                                                          selectedAppointment,
                                                          'accepted',
                                                      )
                                            }
                                            className="bg-moss-700 text-white hover:bg-moss-800"
                                        >
                                            Confirm Appointment
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            <Dialog
                open={rejectingAppointment !== null}
                onOpenChange={(open) => !open && setRejectingAppointment(null)}
            >
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Reject appointment request</DialogTitle>
                        <DialogDescription>
                            The reserved time will become available again. The
                            patient will receive the reason.
                        </DialogDescription>
                    </DialogHeader>
                    <label className="text-sm font-medium text-slate-700">
                        Reason
                        <select
                            value={rejectionReason}
                            onChange={(event) => {
                                setRejectionReason(event.target.value);
                                setRejectionError('');
                            }}
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                        >
                            <option value="">Select a reason</option>
                            <option value="doctor_unavailable">
                                Doctor unavailable
                            </option>
                            <option value="schedule_adjustment">
                                Schedule adjustment needed
                            </option>
                            <option value="clinic_unavailable">
                                Clinic unavailable
                            </option>
                            <option value="incomplete_requirements">
                                Incomplete requirements
                            </option>
                            <option value="duplicate_appointment">
                                Duplicate appointment
                            </option>
                            <option value="other">Other</option>
                        </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                        Details{' '}
                        {rejectionReason === 'other'
                            ? '(required)'
                            : '(optional)'}
                        <textarea
                            value={rejectionDetails}
                            maxLength={500}
                            onChange={(event) => {
                                setRejectionDetails(event.target.value);
                                setRejectionError('');
                            }}
                            rows={4}
                            className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm"
                        />
                    </label>
                    {rejectionError && (
                        <p className="text-sm text-red-600">{rejectionError}</p>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setRejectingAppointment(null)}
                        >
                            Keep Request
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={updatingId !== null}
                            onClick={reject}
                        >
                            Reject Request
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
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
