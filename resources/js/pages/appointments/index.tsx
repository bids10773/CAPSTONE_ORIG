import { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Calendar,
    Plus,
    Search,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    Building2,
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Appointments', href: '' }];

interface AppointmentData {
    id: number;
    appointment_date: string;
    type: string;
    status: string;
    service_type: string;
    referral_code: string | null;
    user: { id: number; first_name: string; last_name: string; email: string };
    company: { id: number; name: string } | null;
}

export default function AppointmentsIndex() {
    const props = usePage().props as any;
    const { appointments, filters, can } = props;

    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [typeFilter, setTypeFilter] = useState(filters?.type || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const delayDebounce = setTimeout(() => {
            router.get(
                '/appointments',
                {
                    search,
                    status: statusFilter,
                    type: typeFilter,
                },
                {
                    preserveState: true,
                    replace: true,
                    onFinish: () => setLoading(false),
                },
            );
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [search, statusFilter, typeFilter]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'accepted':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'arrived':
                return 'bg-moss-50 text-moss-700 border-moss-200';
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            main: date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };
    };

    return (
        <>
            <Head title="Appointments" />

            <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
                {/* PAGE HEADER */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Appointments
                        </h1>
                        <p className="mt-1 text-muted-foreground"></p>
                    </div>
                    {can?.create && (
                        <Link
                            href="/appointments/create"
                            className="flex items-center gap-2 rounded-xl bg-moss-600 px-5 py-2.5 text-white shadow-sm transition-all hover:bg-moss-700 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="font-semibold">
                                New Appointment
                            </span>
                        </Link>
                    )}
                </div>

                {/* SEARCH & FILTERS TOOLBAR */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex flex-col gap-4 lg:flex-row">
                        <div className="group relative flex-1">
                            <Search
                                className={cn(
                                    'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors',
                                    loading
                                        ? 'text-moss-500'
                                        : 'text-gray-400 group-focus-within:text-moss-500',
                                )}
                            />
                            <input
                                type="text"
                                placeholder="Search by patient name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border-transparent bg-gray-50 py-2.5 pr-12 pl-10 transition-all focus:border-moss-500 focus:ring-0"
                            />
                            {loading && (
                                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-moss-500 border-t-transparent" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 rounded-xl border border-transparent bg-gray-50 px-3 focus-within:border-moss-500">
                                <Filter className="h-4 w-4 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                    className="cursor-pointer border-none bg-transparent py-2.5 text-sm font-medium focus:ring-0"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 rounded-xl border border-transparent bg-gray-50 px-3 focus-within:border-moss-500">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <select
                                    value={typeFilter}
                                    onChange={(e) =>
                                        setTypeFilter(e.target.value)
                                    }
                                    className="cursor-pointer border-none bg-transparent py-2.5 text-sm font-medium focus:ring-0"
                                >
                                    <option value="">All Booking Types</option>
                                    <option value="individual">
                                        Individual
                                    </option>
                                    <option value="company_referral">
                                        Company Referral
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABLE CONTAINER */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                                        Patient Details
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                                        Service / Type
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {appointments?.data?.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-20 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="rounded-full bg-gray-50 p-4 text-gray-400">
                                                    <Calendar className="h-8 w-8" />
                                                </div>
                                                <p className="font-medium text-gray-500">
                                                    No appointments match your
                                                    criteria
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.data.map(
                                        (appointment: AppointmentData) => {
                                            const dateInfo = formatDate(
                                                appointment.appointment_date,
                                            );
                                            return (
                                                <tr
                                                    key={appointment.id}
                                                    className="group transition-colors hover:bg-gray-50/80"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-moss-200 bg-moss-100 text-sm font-bold text-moss-600">
                                                                {
                                                                    appointment
                                                                        .user
                                                                        .first_name[0]
                                                                }
                                                                {
                                                                    appointment
                                                                        .user
                                                                        .last_name[0]
                                                                }
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900">
                                                                    {
                                                                        appointment
                                                                            .user
                                                                            .first_name
                                                                    }{' '}
                                                                    {
                                                                        appointment
                                                                            .user
                                                                            .last_name
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {
                                                                        appointment
                                                                            .user
                                                                            .email
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {dateInfo.main}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />{' '}
                                                            {dateInfo.time}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {
                                                                appointment.service_type
                                                            }
                                                        </div>
                                                        <div className="text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
                                                            {appointment.type.replace(
                                                                '_',
                                                                ' ',
                                                            )}
                                                        </div>
                                                        {appointment.company && (
                                                            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-moss-600">
                                                                <Building2 className="h-3 w-3" />{' '}
                                                                {
                                                                    appointment
                                                                        .company
                                                                        .name
                                                                }
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors',
                                                                getStatusStyles(
                                                                    appointment.status,
                                                                ),
                                                            )}
                                                        >
                                                            {appointment.status ===
                                                                'pending' && (
                                                                <Clock className="h-3 w-3" />
                                                            )}
                                                            {appointment.status ===
                                                                'completed' && (
                                                                <CheckCircle className="h-3 w-3" />
                                                            )}
                                                            {appointment.status ===
                                                                'cancelled' && (
                                                                <XCircle className="h-3 w-3" />
                                                            )}
                                                            <span className="capitalize">
                                                                {
                                                                    appointment.status
                                                                }
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link
                                                            href={`/appointments/${appointment.id}`}
                                                            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-moss-600 transition-all hover:bg-moss-50"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            Details
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        },
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

AppointmentsIndex.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
