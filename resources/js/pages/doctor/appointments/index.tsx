import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Eye, LockKeyhole, Stethoscope, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Pagination } from '@/components/pagination';
import { SearchFilterToolbar } from '@/components/search-filter-toolbar';
import { StatusBadge } from '@/components/status-badge';
import AppLayout from '@/layouts/app-layout';
import { formatAppointmentDateTime } from '@/lib/appointment-date-time';
import { examinationPurposeLabel } from '@/lib/appointment-status';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Doctor Queue',
        href: '',
    },
];

interface Appointment {
    id: number;
    appointment_date: string;
    start_time?: string | null;
    status: string;
    type: string;
    examination_purpose?: string | null;
    service_types: string;
    is_scheduled_today: boolean;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
    company: {
        company_name: string;
    } | null;
    physical_exam?: any; // Changed to match common Laravel snake_case relationship naming
    medical_examination?: {
        finalized_at?: string | null;
        released_at?: string | null;
    };
    service_queues?: Array<{
        service_role: string;
        status: string;
    }>;
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
                { search, status, per_page: appointments.per_page },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 400);

        return () => clearTimeout(timeout);
    }, [search, status, appointments.per_page]);

    const formatDate = (date: string, startTime?: string | null) =>
        formatAppointmentDateTime(date, startTime);

    const startExam = (appointmentId: number) => {
        router.visit(`/doctor/physical-exam-form/${appointmentId}`);
    };

    return (
        <>
            <Head title={`${pageTitle} - Doctor`} />

            <div className="clinical-queue mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                {/* Filters */}
                <SearchFilterToolbar
                    className="mb-6"
                    title={pageTitle}
                    search={{
                        value: search,
                        onChange: (event) => setSearch(event.target.value),
                        placeholder: 'Search patient name...',
                        'aria-label': 'Search doctor queue',
                    }}
                    onSubmit={(event) => event.preventDefault()}
                    sections={[
                        {
                            label: 'Status',
                            content: (
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
                                    <option value="completed">
                                        Finalized — Awaiting Release
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
                                    <th className="w-[24%] px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">
                                        Patient
                                    </th>
                                    <th className="w-[19%] px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">
                                        Date & Time
                                    </th>
                                    <th className="w-[25%] px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">
                                        Services / Purpose
                                    </th>
                                    <th className="w-[14%] px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="w-[18%] px-4 py-3 text-right text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">
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
                                            <td className="px-4 py-3">
                                                <p className="truncate font-medium text-gray-900">
                                                    {
                                                        appointment.user
                                                            .first_name
                                                    }{' '}
                                                    {appointment.user.last_name}
                                                </p>
                                                <p
                                                    className="truncate text-sm text-gray-500"
                                                    title={
                                                        appointment.user.email
                                                    }
                                                >
                                                    {appointment.user.email}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-900">
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
                                            <td className="px-4 py-3 text-gray-900">
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
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    status={appointment.status}
                                                />
                                            </td>
                                            <td className="space-x-1 px-4 py-3 text-right whitespace-nowrap">
                                                <Link
                                                    href={`/doctor/appointments/${appointment.id}`}
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
                                                    appointment.is_scheduled_today &&
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

                                                {[
                                                    'accepted',
                                                    'arrived',
                                                ].includes(
                                                    appointment.status.toLowerCase(),
                                                ) &&
                                                    !appointment.is_scheduled_today && (
                                                        <span
                                                            className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500"
                                                            title="The physical examination becomes available on the scheduled date"
                                                        >
                                                            <LockKeyhole className="h-3.5 w-3.5" />
                                                            <span className="hidden 2xl:inline">
                                                                Available on{' '}
                                                                {formatDate(
                                                                    appointment.appointment_date,
                                                                    appointment.start_time,
                                                                )}
                                                            </span>
                                                        </span>
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
                                                {appointment.service_queues?.some(
                                                    (queue) =>
                                                        queue.service_role ===
                                                            'drug_verification' &&
                                                        [
                                                            'assigned',
                                                            'in_progress',
                                                        ].includes(
                                                            queue.status,
                                                        ),
                                                ) && (
                                                    <button
                                                        onClick={() =>
                                                            router.visit(
                                                                `/doctor/final-evaluation/${appointment.id}`,
                                                            )
                                                        }
                                                        className="inline-flex items-center rounded-2xl p-2 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                                        title="Verify official drug-test result"
                                                    >
                                                        <Stethoscope className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {appointment.status.toLowerCase() ===
                                                    'completed' &&
                                                    appointment
                                                        .medical_examination
                                                        ?.finalized_at &&
                                                    !appointment
                                                        .medical_examination
                                                        ?.released_at && (
                                                        <button
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/doctor/final-evaluation/${appointment.id}`,
                                                                )
                                                            }
                                                            className="inline-flex items-center rounded-2xl bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100"
                                                            title="Review and release finalized report"
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
                                            colSpan={5}
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

                    <Pagination
                        pagination={appointments}
                        label="appointments"
                    />
                </div>
            </div>
        </>
    );
}

DoctorAppointmentsIndex.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
