import { Head, router } from '@inertiajs/react';
import { TestTube, Play } from 'lucide-react';
import { EditResultButton } from '@/components/edit-result-button';
import { Pagination } from '@/components/pagination';
import { SearchFilterToolbar } from '@/components/search-filter-toolbar';
import { StatusBadge } from '@/components/status-badge';
import AppLayout from '@/layouts/app-layout';
import { formatAppointmentDateTime } from '@/lib/appointment-date-time';
import { examinationPurposeLabel } from '@/lib/appointment-status';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Med Tech Queue', href: '/admin/companies' },
];

// Define the shape of each appointment
interface Appointment {
    id: number;
    appointment_date: string;
    start_time?: string | null;
    status: string;
    type: string;
    examination_purpose?: string | null;
    service_type: string;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
    company: {
        company_name: string;
    } | null;
    lab_result?: { status: string } | null;
}

// Define the shape of the paginated data
interface PaginatedAppointments {
    data: Appointment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    appointments: PaginatedAppointments;
    filters: {
        search: string;
        status: string;
        role: string;
    };
    pageTitle: string;
}

export default function MedTechAppointmentsIndex({
    appointments,
    filters,
    pageTitle,
}: Props) {
    const formatDate = (date: string, startTime?: string | null) =>
        formatAppointmentDateTime(date, startTime);

    const startLabTest = (appointmentId: number) => {
        router.visit(`/medtech/lab-results/${appointmentId}`);
    };

    return (
        <>
            <Head title="MedTech Queue" />

            <div className="clinical-queue mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                {/* Filters */}
                <SearchFilterToolbar
                    className="mb-6"
                    title={pageTitle}
                    search={{
                        name: 'search',
                        defaultValue: filters.search,
                        placeholder: 'Search patient name...',
                        'aria-label': 'Search laboratory queue',
                    }}
                    hiddenFields={
                        <input
                            type="hidden"
                            name="per_page"
                            value={appointments.per_page}
                        />
                    }
                    sections={[
                        {
                            label: 'Status',
                            content: (
                                <select
                                    name="status"
                                    defaultValue={filters.status || ''}
                                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                >
                                    <option value="">
                                        All pending laboratory work
                                    </option>
                                    <option value="for_diagnostics">
                                        Waiting for Lab / Verification
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Services / Purpose
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {appointments.data.length > 0 ? (
                                    appointments.data.map((apt) => (
                                        <tr
                                            key={apt.id}
                                            className="transition-colors hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">
                                                    {apt.user.first_name}{' '}
                                                    {apt.user.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {apt.user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span
                                                    className="block truncate whitespace-nowrap"
                                                    title={formatDate(
                                                        apt.appointment_date,
                                                        apt.start_time,
                                                    )}
                                                >
                                                    {formatDate(
                                                        apt.appointment_date,
                                                        apt.start_time,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span
                                                    className="block truncate"
                                                    title={apt.service_type}
                                                >
                                                    {apt.service_type}
                                                </span>
                                                <span
                                                    className="mt-1 block truncate text-xs text-moss-700"
                                                    title={examinationPurposeLabel(
                                                        apt.examination_purpose,
                                                    )}
                                                >
                                                    {examinationPurposeLabel(
                                                        apt.examination_purpose,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {apt.lab_result ? (
                                                    <span className="status-text-only inline-flex text-xs font-bold text-amber-800">
                                                        For Verification
                                                    </span>
                                                ) : (
                                                    <StatusBadge
                                                        status={apt.status}
                                                    />
                                                )}
                                            </td>
                                            <td className="space-x-2 px-6 py-4 text-right">
                                                {apt.status ===
                                                    'for_diagnostics' &&
                                                    (apt.lab_result ? (
                                                        <EditResultButton
                                                            onClick={() =>
                                                                startLabTest(
                                                                    apt.id,
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                startLabTest(
                                                                    apt.id,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
                                                        >
                                                            <Play className="h-3 w-3 fill-current" />
                                                            Encode Lab
                                                        </button>
                                                    ))}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            <TestTube className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                            <p className="text-lg font-medium">
                                                No pending lab requests found.
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

MedTechAppointmentsIndex.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
