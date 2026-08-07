import { Head, Link, router } from '@inertiajs/react';
import { Search, Filter, Eye, TestTube, Play } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Med Tech Queue', href: '/admin/companies' },
];

// Define the shape of each appointment
interface Appointment {
    id: number;
    appointment_date: string;
    status: string;
    type: string;
    service_type: string;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
    company: {
        company_name: string;
    } | null;
    labResult?: any;
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
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const startLabTest = (appointmentId: number) => {
        router.visit(`/medtech/lab-results/${appointmentId}`);
    };

    return (
        <>
            <Head title="MedTech Queue" />

            <div className="clinical-queue mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                            <TestTube className="h-6 w-6 text-moss-600" />
                            {pageTitle}
                        </h1>
                        <p className="mt-1 text-gray-500">
                            Process lab requests forwarded from the Doctor.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <form method="GET" className="flex flex-wrap gap-4">
                        <input
                            type="hidden"
                            name="per_page"
                            value={appointments.per_page}
                        />
                        <div className="relative min-w-[200px] flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="search"
                                defaultValue={filters.search}
                                placeholder="Search patient name..."
                                className="w-full rounded-2xl border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-900 focus:ring-2 focus:ring-moss-500"
                            />
                        </div>
                        <select
                            name="status"
                            defaultValue={
                                filters.status || 'pending_diagnostics'
                            }
                            className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-gray-900"
                        >
                            <option value="pending_diagnostics">
                                Waiting for Lab
                            </option>
                            <option value="arrived">Arrived</option>
                            <option value="completed">Completed</option>
                        </select>
                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded-2xl bg-moss-600 px-4 py-2 text-white transition-colors hover:bg-moss-700"
                        >
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Service
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
                                                {formatDate(
                                                    apt.appointment_date,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {apt.service_type}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge
                                                    status={apt.status}
                                                />
                                            </td>
                                            <td className="space-x-2 px-6 py-4 text-right">
                                                {apt.status ===
                                                    'for_diagnostics' &&
                                                    !apt.labResult && (
                                                        <button
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
                                                    )}
                                                <Link
                                                    href={`/appointments/${apt.id}`}
                                                    className="inline-flex items-center p-2 text-gray-400 hover:text-moss-600"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </Link>
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
