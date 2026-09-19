import { Head, Link, router } from '@inertiajs/react';
import { Eye, Image, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Pagination } from '@/components/pagination';
import { SearchFilterToolbar } from '@/components/search-filter-toolbar';
import { StatusBadge } from '@/components/status-badge';
import AppLayout from '@/layouts/app-layout';
import { formatAppointmentDateTime } from '@/lib/appointment-date-time';
import { examinationPurposeLabel } from '@/lib/appointment-status';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'RadTech Queue', href: '/admin/companies' },
];

interface Appointment {
    id: number;
    appointment_date: string;
    start_time?: string | null;
    status: string;
    type: string;
    examination_purpose?: string | null;
    service_types: string;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
    company: {
        company_name: string;
    } | null;
    xray_report?: { is_completed: boolean; status: string } | null;
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
    const [status, setStatus] = useState(filters.status || '');

    const formatDate = (date: string, startTime?: string | null) =>
        formatAppointmentDateTime(date, startTime);

    const formatService = (service: any) => {
        try {
            const parsed =
                typeof service === 'string' ? JSON.parse(service) : service;
            return Array.isArray(parsed) ? parsed.join(', ') : parsed;
        } catch {
            return service;
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            router.get(
                '/radtech/appointments',
                { search, status, per_page: appointments.per_page },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        }, 500); // ⏱ delay (ms)

        return () => clearTimeout(delayDebounce);
    }, [search, status, appointments.per_page]);

    const startXray = (appointmentId: number) => {
        router.visit(`/radtech/xrays/${appointmentId}`);
    };

    return (
        <>
            <Head title="Rad Tech Queue" />

            <div className="clinical-queue mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                {/* Filters */}
                <SearchFilterToolbar
                    className="mb-6"
                    title={pageTitle}
                    search={{
                        value: search,
                        onChange: (event) => setSearch(event.target.value),
                        placeholder: 'Search patient name...',
                        'aria-label': 'Search X-ray queue',
                    }}
                    onSubmit={(event) => event.preventDefault()}
                    sections={[
                        {
                            label: 'Status',
                            content: (
                                <select
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(event.target.value)
                                    }
                                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                >
                                    <option value="">
                                        All pending X-ray work
                                    </option>
                                    <option value="for_diagnostics">
                                        Waiting for X-Ray / Verification
                                    </option>
                                </select>
                            ),
                        },
                    ]}
                />

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-hidden">
                        <table className="w-full table-fixed">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Services / Purpose
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
                                                <span
                                                    className="block truncate whitespace-nowrap"
                                                    title={formatDate(
                                                        appointment.appointment_date,
                                                        appointment.start_time,
                                                    )}
                                                >
                                                    {formatDate(
                                                        appointment.appointment_date,
                                                        appointment.start_time,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                <span
                                                    className="block truncate"
                                                    title={formatService(
                                                        appointment.service_types,
                                                    )}
                                                >
                                                    {formatService(
                                                        appointment.service_types,
                                                    )}
                                                </span>
                                                <span
                                                    className="mt-1 block truncate text-xs text-moss-700"
                                                    title={examinationPurposeLabel(
                                                        appointment.examination_purpose,
                                                    )}
                                                >
                                                    {examinationPurposeLabel(
                                                        appointment.examination_purpose,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {appointment.xray_report ? (
                                                    <span className="status-text-only inline-flex text-xs font-bold text-amber-800">
                                                        For Verification
                                                    </span>
                                                ) : (
                                                    <StatusBadge
                                                        status={
                                                            appointment.status
                                                        }
                                                    />
                                                )}
                                            </td>
                                            {/* ACTION */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* START BUTTON */}
                                                    {!appointment.xray_report
                                                        ?.is_completed && (
                                                        <button
                                                            onClick={() =>
                                                                startXray(
                                                                    appointment.id,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-2xl bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 transition-all duration-200 hover:bg-green-200"
                                                        >
                                                            <Play className="h-3 w-3" />
                                                            {appointment.xray_report
                                                                ? 'Edit Result'
                                                                : 'Start'}
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
                                            colSpan={5}
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
                    <Pagination
                        pagination={appointments}
                        label="appointments"
                    />
                </div>
            </div>
        </>
    );
}

RadTechAppointmentsIndex.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
