import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Search, Eye, Stethoscope, Play } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Doctor Queue',
        href: '',
    },
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
    physical_exam?: any; // Changed to match common Laravel snake_case relationship naming
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

export default function DoctorAppointmentsIndex(props: Props) {
    const { appointments, filters, pageTitle } = props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

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
        const timeout = setTimeout(() => {
            router.get(
                '/doctor/appointments',
                { ...filters, search, status },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 400);

        return () => clearTimeout(timeout);
    }, [search, status]);

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

    const startExam = (appointmentId: number) => {
        router.visit(`/doctor/physical-exam-form/${appointmentId}`);
    };

    return (
        <>
            <Head title={`${pageTitle} - Doctor`} />

            <div className="clinical-queue mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                            <Calendar className="h-6 w-6" />
                            {pageTitle}
                        </h1>
                        <p className="mt-1 text-gray-500">
                            Accepted appointments ready for physical examination
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap gap-4">
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
                        <select
                            name="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-gray-900"
                        >
                            <option value="">All</option>
                            <option value="arrived">Arrived</option>
                            <option value="accepted">Accepted</option>
                            <option value="for_final_evaluation">
                                Final Evaluation
                            </option>
                        </select>
                    </div>
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
                                                    ?.company_name || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge
                                                    status={appointment.status}
                                                />
                                            </td>
                                            <td className="space-x-2 px-6 py-4 text-right whitespace-nowrap">
                                                <Link
                                                    href={`/appointments/${appointment.id}`}
                                                    className="inline-flex items-center rounded-2xl p-2 text-gray-400 hover:bg-gray-100 hover:text-moss-600"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>

                                                {/* FIXED LOGIC: Show exam button if status is accepted/arrived AND no exam exists */}
                                                {[
                                                    'accepted',
                                                    'arrived',
                                                ].includes(
                                                    appointment.status.toLowerCase(),
                                                ) &&
                                                    !appointment.physical_exam
                                                        ?.id && (
                                                        <button
                                                            onClick={() =>
                                                                startExam(
                                                                    appointment.id,
                                                                )
                                                            }
                                                            className="inline-flex items-center rounded-2xl p-2 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                            title="Start Physical Exam"
                                                        >
                                                            <Play className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                {/* ✅ FINAL EVALUATION */}
                                                {appointment.status.toLowerCase() ===
                                                    'for_final_evaluation' && (
                                                    <button
                                                        onClick={() =>
                                                            router.visit(
                                                                `/doctor/final-evaluation/${appointment.id}`,
                                                            )
                                                        }
                                                        className="inline-flex items-center rounded-2xl p-2 text-moss-600 hover:bg-moss-50 hover:text-moss-700"
                                                        title="Final Evaluation"
                                                    >
                                                        <Stethoscope className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                            <h3 className="mb-2 text-lg font-medium text-gray-900">
                                                {status
                                                    ? `No ${status.replace('_', ' ')} appointments`
                                                    : 'No appointments found'}
                                            </h3>

                                            <p className="text-sm">
                                                {status
                                                    ? `There are currently no appointments with status "${status.replace('_', ' ')}".`
                                                    : 'All appointments are up to date. Check back later.'}
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
                                    <div className="flex gap-1">
                                        {appointments.links.map(
                                            (link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || ''}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                    className={`relative inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium focus:z-20 focus:outline-none ${
                                                        link.active
                                                            ? 'z-10 border-moss-500 bg-moss-50 text-moss-600'
                                                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                                    } ${!link.url && 'pointer-events-none text-gray-400'}`}
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

DoctorAppointmentsIndex.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
