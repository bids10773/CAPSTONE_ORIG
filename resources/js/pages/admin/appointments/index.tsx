import type { PageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Cake,
    CalendarDays,
    CheckCircle2,
    CircleAlert,
    EllipsisVertical,
    Eye,
    HeartHandshake,
    Phone,
    Stethoscope,
    UserRound,
    VenusAndMars,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/pagination';
import { SearchFilterToolbar } from '@/components/search-filter-toolbar';
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import {
    appointmentStatusLabels as statusLabels,
    examinationPurposeLabel,
} from '@/lib/appointment-status';
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

type AssignedStaffRole = 'doctor' | 'receptionist' | 'medtech' | 'radtech';

interface AssignedStaff {
    id: number;
    service_role: AssignedStaffRole;
    is_active: boolean;
    user: Person;
}

interface Appointment {
    id: number;
    appointment_date: string;
    start_time: string | null;
    end_time: string | null;
    status: string;
    type: string;
    examination_purpose?: string | null;
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
    onsite_staff?: AssignedStaff[];
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

type FilterKey = keyof Filters;

const normalizeFilters = (filters: Filters): Filters => ({
    search: filters.search ?? '',
    status: filters.status ?? '',
    type: filters.type ?? '',
    date_filter: filters.date_filter ?? '',
    date_from: filters.date_from ?? '',
    date_to: filters.date_to ?? '',
    doctor_id: filters.doctor_id ?? '',
    company_id: filters.company_id ?? '',
    sort: filters.sort || 'created_at',
    direction: filters.direction || 'desc',
});

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
    pending: 'text-amber-700 dark:text-amber-400',
    accepted: 'text-indigo-700 dark:text-indigo-400',
    arrived: 'text-blue-700 dark:text-blue-400',
    for_diagnostics: 'text-cyan-700 dark:text-cyan-400',
    for_xray: 'text-violet-700 dark:text-violet-400',
    for_final_evaluation: 'text-purple-700 dark:text-purple-400',
    awaiting_xray_result: 'text-amber-700 dark:text-amber-400',
    completed: 'text-emerald-700 dark:text-emerald-400',
    rejected: 'text-rose-700 dark:text-rose-400',
    cancelled: 'text-red-700 dark:text-red-400',
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

const assignedStaffRoles: Array<{
    role: AssignedStaffRole;
    label: string;
    shortLabel: string;
}> = [
    { role: 'doctor', label: 'Doctor', shortLabel: 'Doctor' },
    { role: 'receptionist', label: 'Receptionist', shortLabel: 'Recep.' },
    { role: 'medtech', label: 'Medtech', shortLabel: 'Medtech' },
    { role: 'radtech', label: 'Radtech', shortLabel: 'Radtech' },
];

function assignedStaffNames(
    appointment: Appointment,
    role: AssignedStaffRole,
): string {
    const names = (appointment.onsite_staff ?? [])
        .filter((assignment) => assignment.service_role === role)
        .map((assignment) =>
            role === 'doctor'
                ? `Dr. ${fullName(assignment.user)}`
                : fullName(assignment.user),
        );

    return names.length > 0 ? names.join(', ') : 'Not assigned';
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
            className={`text-xs font-semibold whitespace-nowrap ${statusStyles[status] ?? 'text-slate-600 dark:text-slate-300'}`}
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

function TruncatedText({
    value,
    className,
}: {
    value: string;
    className?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={`block truncate ${className ?? ''}`}>
                    {value}
                </span>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="max-w-xs border border-moss-700 bg-moss-950 text-white shadow-lg [&>svg]:bg-moss-950 [&>svg]:fill-moss-950"
            >
                {value}
            </TooltipContent>
        </Tooltip>
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
        pendingRequestsCount,
    } = usePage<Props>().props;
    const endpoint = bulkOnly
        ? '/admin/bulk-appointments'
        : '/admin/appointments';
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [draftFilters, setDraftFilters] = useState<Filters>(() =>
        normalizeFilters(filters),
    );
    const [search, setSearch] = useState(filters.search ?? '');
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [rejectingAppointment, setRejectingAppointment] =
        useState<Appointment | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionDetails, setRejectionDetails] = useState('');
    const [rejectionError, setRejectionError] = useState('');

    const queryFor = (candidate: Filters) => {
        const common = {
            search: candidate.search.trim() || undefined,
            status: candidate.status || undefined,
            company_id: candidate.company_id || undefined,
            per_page: appointments.per_page,
            page: 1,
        };

        if (bulkOnly) return common;

        return {
            ...common,
            type: candidate.type || undefined,
            date_filter: candidate.date_filter || undefined,
            date_from: candidate.date_from || undefined,
            date_to: candidate.date_to || undefined,
            doctor_id: candidate.doctor_id || undefined,
            sort: candidate.sort || undefined,
            direction: candidate.direction || undefined,
        };
    };

    const visit = (next: Partial<Filters>) => {
        const candidate = normalizeFilters({
            ...draftFilters,
            ...next,
        });

        setLoading(true);
        router.get(endpoint, queryFor(candidate), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setLoading(false),
        });
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            router.get(endpoint, queryFor({ ...draftFilters, search }), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
        // Match Staff Management: search is independent from draft filters.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const updateDraftFilter = (key: FilterKey, value: string | number) => {
        setDraftFilters((current) => ({ ...current, [key]: value }));
    };

    const applyFilters = () => {
        visit({ ...draftFilters, search });
    };

    const clearFilters = () => {
        setSearch('');
        setDraftFilters(
            normalizeFilters({
                search: '',
                status: '',
                type: '',
                date_filter: '',
                date_from: '',
                date_to: '',
                doctor_id: '',
                company_id: '',
                sort: 'created_at',
                direction: 'desc',
            }),
        );
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

    const removeFilter = (key: FilterKey) => {
        const next = normalizeFilters({
            ...draftFilters,
            [key]: key === 'sort' ? 'created_at' : '',
            ...(key === 'sort' ? { direction: 'desc' } : {}),
        });
        if (key === 'search') setSearch('');
        setDraftFilters(next);
        visit(next);
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

    const appliedFilters = normalizeFilters(filters);
    const appliedFilterChips: Array<{ key: FilterKey; label: string }> = [];

    if (appliedFilters.search) {
        appliedFilterChips.push({
            key: 'search',
            label: `Search: ${appliedFilters.search}`,
        });
    }
    if (appliedFilters.type) {
        appliedFilterChips.push({
            key: 'type',
            label: `Type: ${typeOptions[appliedFilters.type] ?? appliedFilters.type}`,
        });
    }
    if (appliedFilters.company_id) {
        const company = companies.find(
            (item) => String(item.id) === String(appliedFilters.company_id),
        );
        appliedFilterChips.push({
            key: 'company_id',
            label: `Company: ${company?.company_name ?? appliedFilters.company_id}`,
        });
    }
    if (appliedFilters.status) {
        appliedFilterChips.push({
            key: 'status',
            label: `Status: ${statusLabels[appliedFilters.status] ?? appliedFilters.status.replaceAll('_', ' ')}`,
        });
    }
    if (appliedFilters.doctor_id) {
        const doctor = doctors.find(
            (item) => String(item.id) === String(appliedFilters.doctor_id),
        );
        appliedFilterChips.push({
            key: 'doctor_id',
            label: `Doctor: ${doctor ? `Dr. ${fullName(doctor)}` : appliedFilters.doctor_id}`,
        });
    }
    if (appliedFilters.date_filter) {
        appliedFilterChips.push({
            key: 'date_filter',
            label: `Date: ${appliedFilters.date_filter.replaceAll('_', ' ')}`,
        });
    }
    if (appliedFilters.date_from) {
        appliedFilterChips.push({
            key: 'date_from',
            label: `From: ${appliedFilters.date_from}`,
        });
    }
    if (appliedFilters.date_to) {
        appliedFilterChips.push({
            key: 'date_to',
            label: `To: ${appliedFilters.date_to}`,
        });
    }
    if (
        appliedFilters.sort !== 'created_at' ||
        appliedFilters.direction !== 'desc'
    ) {
        const sortLabels: Record<string, string> = {
            'appointment_date:desc': 'Newest appointment first',
            'appointment_date:asc': 'Oldest appointment first',
            'created_at:desc': 'Recently created',
            'status:asc': 'Status',
        };
        appliedFilterChips.push({
            key: 'sort',
            label: `Sort: ${sortLabels[`${appliedFilters.sort}:${appliedFilters.direction}`] ?? appliedFilters.sort}`,
        });
    }

    const hasFilters = appliedFilterChips.length > 0;

    const appointmentActions = (appointment: Appointment) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={`Actions for ${fullName(appointment.user)}`}
                    className="inline-flex size-8 items-center justify-center text-slate-400 transition-colors hover:text-moss-700 focus-visible:outline-none"
                >
                    <EllipsisVertical className="size-5" />
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
            <div className="space-y-4 p-3 sm:p-4 lg:p-5">
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

                <section className="relative z-20 overflow-visible">
                    <SearchFilterToolbar
                        title={
                            bulkOnly ? 'Company Bulk Requests' : 'Appointments'
                        }
                        search={{
                            name: 'search',
                            value: search,
                            maxLength: 100,
                            onChange: (event) => setSearch(event.target.value),
                            placeholder: bulkOnly
                                ? 'Search company name or status...'
                                : 'Search patient, company, doctor, or referral code...',
                            'aria-label': 'Search appointments',
                        }}
                        loading={loading}
                        onSubmit={(event) => {
                            event.preventDefault();
                            applyFilters();
                        }}
                        sections={[
                            {
                                label: bulkOnly
                                    ? 'Company'
                                    : 'Appointment Type / Company',
                                content: (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {!bulkOnly && (
                                            <select
                                                value={draftFilters.type}
                                                onChange={(event) =>
                                                    updateDraftFilter(
                                                        'type',
                                                        event.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                            >
                                                <option value="">
                                                    All appointment types
                                                </option>
                                                {Object.entries(
                                                    typeOptions,
                                                ).map(([value, label]) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        <select
                                            value={draftFilters.company_id}
                                            onChange={(event) =>
                                                updateDraftFilter(
                                                    'company_id',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                        >
                                            <option value="">
                                                All companies
                                            </option>
                                            {companies.map((company) => (
                                                <option
                                                    key={company.id}
                                                    value={company.id}
                                                >
                                                    {company.company_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ),
                            },
                            {
                                label: 'Work Info',
                                content: (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <select
                                            value={draftFilters.status}
                                            onChange={(event) =>
                                                updateDraftFilter(
                                                    'status',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                        >
                                            <option value="">
                                                All statuses
                                            </option>
                                            {statusOptions.map((status) => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                >
                                                    {statusLabels[status] ??
                                                        status.replaceAll(
                                                            '_',
                                                            ' ',
                                                        )}
                                                </option>
                                            ))}
                                        </select>
                                        {!bulkOnly && (
                                            <select
                                                value={draftFilters.doctor_id}
                                                onChange={(event) =>
                                                    updateDraftFilter(
                                                        'doctor_id',
                                                        event.target.value,
                                                    )
                                                }
                                                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                            >
                                                <option value="">
                                                    All doctors
                                                </option>
                                                {doctors.map((doctor) => (
                                                    <option
                                                        key={doctor.id}
                                                        value={doctor.id}
                                                    >
                                                        Dr. {fullName(doctor)}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                label: 'Advanced',
                                content: (
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <select
                                            value={draftFilters.date_filter}
                                            onChange={(event) =>
                                                updateDraftFilter(
                                                    'date_filter',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                        >
                                            <option value="">Any date</option>
                                            <option value="today">Today</option>
                                            <option value="upcoming">
                                                Upcoming
                                            </option>
                                            <option value="past">Past</option>
                                        </select>
                                        <input
                                            type="date"
                                            aria-label="From date"
                                            value={draftFilters.date_from}
                                            onChange={(event) =>
                                                updateDraftFilter(
                                                    'date_from',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
                                        />
                                        <input
                                            type="date"
                                            aria-label="To date"
                                            value={draftFilters.date_to}
                                            onChange={(event) =>
                                                updateDraftFilter(
                                                    'date_to',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
                                        />
                                    </div>
                                ),
                            },
                            {
                                label: 'Group By',
                                content: (
                                    <select
                                        value={`${draftFilters.sort}:${draftFilters.direction}`}
                                        onChange={(event) => {
                                            const [sort, direction] =
                                                event.target.value.split(':');
                                            setDraftFilters((current) => ({
                                                ...current,
                                                sort,
                                                direction,
                                            }));
                                        }}
                                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                    >
                                        <option value="appointment_date:desc">
                                            Newest appointment first
                                        </option>
                                        <option value="appointment_date:asc">
                                            Oldest appointment first
                                        </option>
                                        <option value="created_at:desc">
                                            Recently created
                                        </option>
                                        <option value="status:asc">
                                            Status
                                        </option>
                                    </select>
                                ),
                            },
                        ].filter(
                            (section) =>
                                !bulkOnly ||
                                !['Advanced', 'Group By'].includes(
                                    section.label,
                                ),
                        )}
                        actions={
                            <div className="inline-flex h-12 w-fit shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-600 shadow-sm dark:border-border dark:bg-card dark:text-slate-300">
                                <CalendarDays className="size-4 text-moss-600" />
                                {appointments.total.toLocaleString()}{' '}
                                {filters.search ? 'matching' : 'total'}
                            </div>
                        }
                    />

                    {hasFilters && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-600 px-3 py-2 text-xs font-bold text-white">
                                Filters:
                            </span>
                            {appliedFilterChips.map((chip) => (
                                <span
                                    key={chip.key}
                                    className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-400 bg-white py-1 pr-1.5 pl-3 text-xs font-semibold text-slate-700 shadow-sm"
                                >
                                    <span className="capitalize">
                                        {chip.label}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeFilter(chip.key)}
                                        aria-label={`Remove ${chip.label} filter`}
                                        className="inline-flex size-6 items-center justify-center rounded-full bg-slate-500 text-white transition-colors hover:bg-rose-500"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </span>
                            ))}
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-500 shadow-sm transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                            >
                                <X className="size-3.5" /> Clear all
                            </button>
                        </div>
                    )}
                </section>

                <section
                    className={`relative z-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity dark:border-border dark:bg-card ${loading ? 'opacity-60' : 'opacity-100'}`}
                    aria-busy={loading}
                >
                    {appointments.data.length > 0 ? (
                        <>
                            <div className="hidden xl:block">
                                <table className="w-full table-fixed text-left">
                                    <thead className="border-b border-moss-100 bg-moss-50/90 text-xs font-semibold text-moss-900 dark:border-moss-900 dark:bg-moss-950/40 dark:text-moss-100">
                                        <tr>
                                            <th className="w-[5%] px-3 py-3">
                                                ID
                                            </th>
                                            <th className="w-[16%] px-3 py-3">
                                                {bulkOnly
                                                    ? 'Requester'
                                                    : 'Patient'}
                                            </th>
                                            <th className="w-[17%] px-3 py-3">
                                                Contacts
                                            </th>
                                            <th className="w-[14%] px-3 py-3">
                                                {bulkOnly
                                                    ? 'Assigned Staff'
                                                    : 'Doctor'}
                                            </th>
                                            <th className="w-[13%] px-3 py-3">
                                                Company
                                            </th>
                                            <th className="w-[10%] px-3 py-3">
                                                Visit / Purpose
                                            </th>
                                            <th className="w-[12%] px-3 py-3">
                                                Time
                                            </th>
                                            <th className="w-[9%] px-3 py-3">
                                                Status
                                            </th>
                                            <th className="w-[4%] px-3 py-3 text-right">
                                                <span className="sr-only">
                                                    Actions
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-border">
                                        {appointments.data.map(
                                            (appointment) => (
                                                <tr
                                                    key={appointment.id}
                                                    className="text-sm text-slate-700 transition-colors hover:bg-moss-50/50 dark:text-slate-300 dark:hover:bg-moss-900/25"
                                                >
                                                    <td className="px-3 py-2.5 font-medium text-slate-500">
                                                        #{appointment.id}
                                                    </td>
                                                    <td className="min-w-0 px-3 py-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-moss-100 text-[11px] font-bold text-moss-700 ring-2 ring-white">
                                                                {appointment.user.first_name.charAt(
                                                                    0,
                                                                )}
                                                                {appointment.user.last_name.charAt(
                                                                    0,
                                                                )}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <TruncatedText
                                                                    value={fullName(
                                                                        appointment.user,
                                                                    )}
                                                                    className="font-semibold text-slate-900 dark:text-slate-100"
                                                                />
                                                                <TruncatedText
                                                                    value={
                                                                        appointment.company
                                                                            ? `Company · ${appointment.company.company_name}`
                                                                            : typeLabels[
                                                                                    appointment
                                                                                        .type
                                                                                ] ===
                                                                                'Walk-in'
                                                                              ? 'Walk-in patient'
                                                                              : 'Individual patient'
                                                                    }
                                                                    className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400"
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="min-w-0 px-3 py-2.5">
                                                        <TruncatedText
                                                            value={
                                                                appointment.user
                                                                    .contact ??
                                                                'No contact number'
                                                            }
                                                            className="font-medium text-slate-700 dark:text-slate-200"
                                                        />
                                                        <TruncatedText
                                                            value={
                                                                appointment.user
                                                                    .email ??
                                                                'No email address'
                                                            }
                                                            className="mt-0.5 text-xs text-slate-400 dark:text-slate-400"
                                                        />
                                                    </td>
                                                    <td className="min-w-0 px-3 py-2.5">
                                                        {bulkOnly ? (
                                                            <AssignedStaffSummary
                                                                appointment={
                                                                    appointment
                                                                }
                                                                compact
                                                            />
                                                        ) : appointment.doctor ? (
                                                            <TruncatedText
                                                                value={`Dr. ${fullName(appointment.doctor)}`}
                                                                className="font-medium text-slate-700 dark:text-slate-200"
                                                            />
                                                        ) : (
                                                            <span className="text-slate-400 dark:text-slate-500">
                                                                Not assigned
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="min-w-0 px-3 py-2.5">
                                                        <TruncatedText
                                                            value={
                                                                appointment
                                                                    .company
                                                                    ?.company_name ??
                                                                'Not applicable'
                                                            }
                                                            className="dark:text-slate-300"
                                                        />
                                                    </td>
                                                    <td className="min-w-0 px-3 py-2.5 font-medium text-slate-700">
                                                        <TruncatedText
                                                            value={
                                                                typeLabels[
                                                                    appointment
                                                                        .type
                                                                ] ??
                                                                appointment.type.replaceAll(
                                                                    '_',
                                                                    ' ',
                                                                )
                                                            }
                                                            className="dark:text-slate-300"
                                                        />
                                                        <TruncatedText
                                                            value={examinationPurposeLabel(
                                                                appointment.examination_purpose,
                                                            )}
                                                            className="mt-0.5 text-xs text-moss-700 dark:text-moss-300"
                                                        />
                                                    </td>
                                                    <td className="min-w-0 px-3 py-2.5">
                                                        <TruncatedText
                                                            value={appointmentTime(
                                                                appointment,
                                                            )}
                                                            className="font-medium text-slate-800 dark:text-slate-200"
                                                        />
                                                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                                            {formatDate(
                                                                appointment.appointment_date,
                                                            )}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <StatusBadge
                                                            status={
                                                                appointment.status
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right">
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

                            <div className="divide-y divide-slate-100 xl:hidden dark:divide-border">
                                {appointments.data.map((appointment) => (
                                    <article
                                        key={appointment.id}
                                        className="p-4 transition-colors hover:bg-moss-50/50 sm:p-5 dark:hover:bg-moss-900/25"
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
                                            <span
                                                className="inline-block max-w-44 truncate rounded-full border border-moss-200 bg-moss-50 px-2.5 py-1 text-xs font-semibold text-moss-700 dark:border-moss-800 dark:bg-moss-950/40 dark:text-moss-300"
                                                title={examinationPurposeLabel(
                                                    appointment.examination_purpose,
                                                )}
                                            >
                                                {examinationPurposeLabel(
                                                    appointment.examination_purpose,
                                                )}
                                            </span>
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
                                        {bulkOnly ? (
                                            <div className="mt-4 border-t border-slate-100 pt-3">
                                                <AssignedStaffSummary
                                                    appointment={appointment}
                                                />
                                            </div>
                                        ) : (
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
                                        )}
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
                                    icon={VenusAndMars}
                                    label="Sex"
                                    value={
                                        selectedAppointment.user.patient_profile
                                            ?.sex
                                            ? formatProfileValue(
                                                  selectedAppointment.user
                                                      .patient_profile.sex,
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
                                {!bulkOnly && (
                                    <DetailCard
                                        icon={Stethoscope}
                                        label="Assigned doctor"
                                        value={
                                            selectedAppointment.doctor
                                                ? `Dr. ${fullName(selectedAppointment.doctor)}`
                                                : 'Not assigned'
                                        }
                                    />
                                )}
                            </div>
                        </section>

                        {bulkOnly && (
                            <section>
                                <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                    Assigned staff
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {assignedStaffRoles.map(
                                        ({ role, label }) => (
                                            <DetailCard
                                                key={role}
                                                icon={
                                                    role === 'doctor'
                                                        ? Stethoscope
                                                        : UserRound
                                                }
                                                label={label}
                                                value={assignedStaffNames(
                                                    selectedAppointment,
                                                    role,
                                                )}
                                            />
                                        ),
                                    )}
                                </div>
                            </section>
                        )}

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

function AssignedStaffSummary({
    appointment,
}: {
    appointment: Appointment;
    compact?: boolean;
}) {
    const assignments = assignedStaffRoles.flatMap(({ role, label }) =>
        (appointment.onsite_staff ?? [])
            .filter((assignment) => assignment.service_role === role)
            .map((assignment) => ({
                id: assignment.id,
                role: label,
                name:
                    role === 'doctor'
                        ? `Dr. ${fullName(assignment.user)}`
                        : fullName(assignment.user),
            })),
    );

    if (assignments.length === 0) {
        return <span className="text-xs text-slate-400">Not assigned</span>;
    }

    const first = assignments[0];
    const remaining = assignments.length - 1;

    return (
        <div className="flex min-w-0 items-center gap-1.5 text-xs">
            <span className="min-w-0 truncate font-medium text-slate-700 dark:text-slate-200">
                <span className="font-semibold text-slate-500">
                    {first.role}:{' '}
                </span>
                {first.name}
            </span>
            {remaining > 0 && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className="shrink-0 rounded-full bg-moss-100 px-2 py-0.5 text-[10px] font-bold text-moss-700 hover:bg-moss-200 focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none"
                            aria-label={`Show all ${assignments.length} assigned staff`}
                        >
                            +{remaining} more
                        </button>
                    </TooltipTrigger>
                    <TooltipContent
                        side="top"
                        className="max-w-sm border border-moss-700 bg-moss-950 text-white shadow-lg [&>svg]:bg-moss-950 [&>svg]:fill-moss-950"
                    >
                        <p className="mb-1.5 text-xs font-semibold">
                            Assigned staff
                        </p>
                        <div className="space-y-1">
                            {assignments.map((assignment) => (
                                <p key={assignment.id} className="text-xs">
                                    <span className="font-semibold">
                                        {assignment.role}:
                                    </span>{' '}
                                    {assignment.name}
                                </p>
                            ))}
                        </div>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
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
