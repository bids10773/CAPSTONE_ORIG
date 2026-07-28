import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    Calendar,
    Search,
    Filter,
    Eye,
    Image,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Play,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { StatusBadge } from '@/components/status-badge';
import type { BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'RadTech Queue', href: '/admin/companies' },
];

interface Appointment {
    id: number;
    appointment_date: string;
    status: string;
    type: string;
    service_types: string;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
    company: {
        company_name: string;
    } | null;
    xrayReport?: any;
}

interface Props {
    appointments: {
        data: Appointment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search: string;
        status: string;
        role: string;
    };
    pageTitle: string;
}

export default function RadTechAppointmentsIndex(props: Props) {
    const { appointments, filters, pageTitle } = props;
    const [search, setSearch] = useState(filters.search || '');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'for_xray':
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'for_xray':
                return <AlertCircle className="h-4 w-4 text-yellow-600" />;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'individual':
                return 'Individual';
            case 'company_referral':
                return 'Company Referral';
            case 'company_bulk':
                return 'Bulk Booking';
            default:
                return type;
        }
    };

    const formatService = (service: any) => {
        try {
            const parsed =
                typeof service === 'string' ? JSON.parse(service) : service;
            return Array.isArray(parsed) ? parsed.join(', ') : parsed;
        } catch {
            return service;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'for_diagnostics':
                return 'Laboratory';
            case 'for_xray':
                return 'X-Ray';
            case 'for_final_evaluation':
                return 'Final Evaluation';
            default:
                return status.replace('_', ' ');
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            router.get(
                '/radtech/appointments',
                { search },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        }, 500); // ⏱ delay (ms)

        return () => clearTimeout(delayDebounce);
    }, [search]);

    const startXray = (appointmentId: number) => {
        router.visit(`/radtech/xrays/${appointmentId}`);
    };

    return (
        <>
            <Head title="Rad Tech Queue" />

            <div className="clinical-queue mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                            <Calendar className="h-6 w-6" />
                            {pageTitle}
                        </h1>
                        <p className="mt-1 text-gray-500">
                            X-Ray requests pending processing
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <form method="GET" className="flex flex-wrap gap-4">
                        <div className="min-w-[200px] flex-1">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search patient name..."
                                    className="w-full rounded-2xl border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-900 focus:ring-2 focus:ring-moss-500"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Service
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Company
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {appointments.data.length > 0 ? (
                                    appointments.data.map((appointment) => (
                                        <tr
                                            key={appointment.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">
                                                    {
                                                        appointment.user
                                                            .first_name
                                                    }{' '}
                                                    {appointment.user.last_name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {appointment.user.email}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {formatDate(
                                                    appointment.appointment_date,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {formatService(
                                                    appointment.service_types,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {getTypeLabel(appointment.type)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {appointment.company
                                                    ?.company_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge
                                                    status={appointment.status}
                                                />
                                            </td>
                                            {/* ACTION */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* START BUTTON */}
                                                    {appointment.status ===
                                                        'for_xray' &&
                                                        !appointment.xrayReport && (
                                                            <button
                                                                onClick={() =>
                                                                    startXray(
                                                                        appointment.id,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-2xl bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 transition-all duration-200 hover:bg-green-200"
                                                            >
                                                                <Play className="h-3 w-3" />
                                                                Start
                                                            </button>
                                                        )}

                                                    {/* VIEW BUTTON */}
                                                    <Link
                                                        href={`/appointments/${appointment.id}`}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition-all duration-200 hover:bg-moss-100 hover:text-moss-600"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            <Image className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                            <h3 className="mb-2 text-lg font-medium text-gray-900">
                                                No pending X-Ray requests
                                            </h3>
                                            <p className="text-sm">
                                                Check back later for new imaging
                                                requests.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {appointments.links && appointments.links.length > 3 && (
                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                            <nav className="flex items-center justify-between">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <Link
                                        href={appointments.links[0]?.url || ''}
                                        className="relative inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Previous
                                    </Link>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing{' '}
                                            <span className="font-medium">
                                                {(appointments.current_page -
                                                    1) *
                                                    appointments.per_page +
                                                    1}
                                            </span>{' '}
                                            to{' '}
                                            <span className="font-medium">
                                                {Math.min(
                                                    appointments.current_page *
                                                        appointments.per_page,
                                                    appointments.total,
                                                )}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-medium">
                                                {appointments.total}
                                            </span>{' '}
                                            results
                                        </p>
                                    </div>
                                    <div>
                                        {appointments.links.map(
                                            (link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || ''}
                                                    className={`relative inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium focus:z-20 focus:outline-none ${
                                                        link.active
                                                            ? 'z-10 border-moss-500 bg-moss-50 text-moss-600'
                                                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                                    } ${!link.url && 'pointer-events-none text-gray-400'}`}
                                                >
                                                    {link.label ===
                                                        'Previous' && (
                                                        <ChevronLeft className="h-5 w-5" />
                                                    )}
                                                    {link.label === 'Next' && (
                                                        <ChevronRight className="h-5 w-5" />
                                                    )}
                                                    {link.label.replace(
                                                        /\\w/g,
                                                        '',
                                                    )}
                                                </Link>
                                            ),
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-1 justify-end sm:hidden">
                                    <Link
                                        href={
                                            appointments.links[
                                                appointments.links.length - 1
                                            ]?.url || ''
                                        }
                                        className="relative inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Next
                                    </Link>
                                </div>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

RadTechAppointmentsIndex.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
