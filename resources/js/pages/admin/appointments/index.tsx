import type { PageProps } from '@inertiajs/core'; // Import this at the top
import { Head, usePage, router } from '@inertiajs/react';
import {
    Eye,
    CheckCircle,
    CheckCircle2,
    XCircle,
    Search,
    UserCheck,
    FileWarning,
    Phone,
    Mail,
    User,
    ArrowRight,
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: '/admin/appointments' },
];

interface PatientProfile {
    birthdate?: string;
    sex?: string;
    civil_status?: string;
}

interface Appointment {
    id: number;
    appointment_date: string;
    start_time: string; // 👈 ADD THIS
    end_time: string;
    status: string;
    type: string;
    service_types: string;
    user: {
        first_name: string;
        last_name: string;
        email: string;
        contact: string;
        patient_profile?: PatientProfile;
    };
    company: {
        company_name: string;
    } | null;
    doctor?: {
        first_name: string;
        last_name: string;
    };
}

interface Props extends PageProps {
    appointments: {
        data: Appointment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search: string;
        status: string;
    };
    bulkOnly: boolean;
}

export default function AdminAppointmentsIndex() {
    const { appointments, filters, bulkOnly } = usePage<Props>().props;
    const endpoint = bulkOnly
        ? '/admin/bulk-appointments'
        : '/admin/appointments';
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    // 1. Validation Logic: Checks if the profile is ready for the Doctor
    const getMissingFields = (apt: Appointment) => {
        if (apt.type === 'company_bulk') return [];

        const fields = [];
        const p = apt.user.patient_profile;
        if (!p?.birthdate) fields.push('Birthdate');
        if (!p?.sex) fields.push('Sex');
        if (!apt.user.contact) fields.push('Contact Number');

        return fields;
    };

    //for service_types arraay format
    const isComplete = (apt: Appointment) => getMissingFields(apt).length === 0;

    // 2. Debounced Search
    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                endpoint,
                { ...filters, search, per_page: appointments.per_page },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 400);
        return () => clearTimeout(timeout);
    }, [search, endpoint, filters, appointments.per_page]);

    const acceptAppointment = (id: number) => {
        router.patch(
            `/admin/appointments/${id}/status`,
            { status: 'accepted' },
            {
                onSuccess: () => setSelectedAppointment(null),
            },
        );
    };

    const cancelAppointment = (id: number) => {
        router.patch(
            `/admin/appointments/${id}/status`,
            {
                status: 'cancelled',
            },
            {
                onSuccess: () => {
                    setSelectedAppointment(null);
                },
            },
        );
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'accepted':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'arrived':
                return 'bg-moss-100 text-moss-800 border-moss-200';

            case 'for_diagnostics':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'for_xray':
                return 'bg-pink-100 text-pink-800 border-pink-200';
            case 'for_final_evaluation':
                return 'bg-orange-100 text-orange-800 border-orange-200';

            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';

            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
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

    const getAge = (birthdate?: string) => {
        if (!birthdate) return 'N/A';
        return Math.floor(
            (new Date().getTime() - new Date(birthdate).getTime()) /
                31557600000,
        );
    };

    return (
        <>
            <Head
                title={
                    bulkOnly ? 'Admin - Bulk Requests' : 'Admin - Appointments'
                }
            />
            <div className="p-6">
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-slate-950">
                        {bulkOnly
                            ? 'Company Bulk Requests'
                            : 'Individual Appointments'}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {bulkOnly
                            ? 'Approve company requests without individual patient-profile requirements.'
                            : 'Review patient readiness before approving individual appointments.'}
                    </p>
                </div>
                {/* Search and Filters */}
                <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-white p-4 md:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border py-2 pr-4 pl-10"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) =>
                            router.get(endpoint, {
                                ...filters,
                                status: e.target.value,
                                per_page: appointments.per_page,
                            })
                        }
                        className="rounded-lg border px-4 py-2"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending Review</option>
                        <option value="accepted">Accepted (To Doctor)</option>
                        <option value="pending_diagnostics">
                            At Laboratory
                        </option>
                        <option value="completed">Completed</option>
                        <option value="pending_xray">Pending Xray</option>
                    </select>
                </div>

                {/* Main Table */}
                <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <table className="w-full text-left">
                        <thead className="border-b bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">
                                    {bulkOnly
                                        ? 'Company Contact'
                                        : 'Patient Profile'}
                                </th>
                                <th className="px-6 py-4">Readiness</th>
                                <th className="px-6 py-4">Schedule</th>
                                <th className="px-6 py-4">Appointment type</th>
                                <th className="px-6 py-4">Service type</th>
                                <th className="px-6 py-4">Doctor</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {appointments.data.map((apt) => (
                                <tr
                                    key={apt.id}
                                    className="transition-colors hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4">
                                        {apt.type === 'company_bulk' ? (
                                            <div className="space-y-1">
                                                <p className="flex items-center gap-1.5 text-sm text-gray-700">
                                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                    {apt.user.email}
                                                </p>
                                                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                    {apt.user.contact ||
                                                        'Not provided'}
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="font-bold text-gray-900">
                                                    {apt.user.first_name}{' '}
                                                    {apt.user.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {apt.user.email}
                                                </p>
                                            </>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {apt.type === 'company_bulk' ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 uppercase">
                                                <UserCheck className="h-3.5 w-3.5" />{' '}
                                                Bulk Request
                                            </span>
                                        ) : isComplete(apt) ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
                                                <UserCheck className="h-3.5 w-3.5" />{' '}
                                                Profile Complete
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
                                                <FileWarning className="h-3.5 w-3.5" />{' '}
                                                Missing Info
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex flex-col">
                                            <span>
                                                {new Date(
                                                    apt.appointment_date,
                                                ).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {apt.start_time} -{' '}
                                                {apt.end_time}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                apt.type === 'individual'
                                                    ? 'bg-moss-100 text-moss-800'
                                                    : apt.type ===
                                                        'company_referral'
                                                      ? 'bg-purple-100 text-purple-800'
                                                      : apt.type ===
                                                          'company_bulk'
                                                        ? 'bg-orange-100 text-orange-800'
                                                        : 'bg-gray-100 text-gray-800'
                                            } `}
                                        >
                                            {apt.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(() => {
                                                try {
                                                    const parsed =
                                                        typeof apt.service_types ===
                                                        'string'
                                                            ? JSON.parse(
                                                                  apt.service_types,
                                                              )
                                                            : apt.service_types;

                                                    return Array.isArray(
                                                        parsed,
                                                    ) ? (
                                                        parsed.map(
                                                            (
                                                                s: string,
                                                                i: number,
                                                            ) => (
                                                                <span
                                                                    key={i}
                                                                    className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                                                                >
                                                                    {s}
                                                                </span>
                                                            ),
                                                        )
                                                    ) : (
                                                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                                                            {parsed}
                                                        </span>
                                                    );
                                                } catch {
                                                    return (
                                                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                                                            {apt.service_types}
                                                        </span>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {apt.doctor ? (
                                            <span className="font-medium">
                                                Dr. {apt.doctor.first_name}{' '}
                                                {apt.doctor.last_name}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">
                                                Not Assigned
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${getStatusStyle(apt.status)}`}
                                        >
                                            {getStatusLabel(apt.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setSelectedAppointment(apt)
                                            }
                                            className="gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                        >
                                            <Eye className="h-4 w-4" /> View
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        pagination={appointments}
                        label="appointments"
                    />
                </div>

                {/* Vetting Modal */}
                {selectedAppointment && (
                    <Dialog
                        open={true}
                        onOpenChange={() => setSelectedAppointment(null)}
                    >
                        <DialogContent className="max-h-[90vh] w-full max-w-5xl overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl">
                                    <User className="h-5 w-5 text-moss-600" />
                                    {selectedAppointment.type === 'company_bulk'
                                        ? 'Review Company Bulk Request'
                                        : 'Review Patient Information'}
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedAppointment.type === 'company_bulk'
                                        ? 'Verify the company contact details before approving this request.'
                                        : 'Verify all fields before sending to the medical queue.'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                {/* Details Card */}
                                <div className="min-w-0 space-y-3 rounded-xl border bg-gray-50 p-4">
                                    <h4 className="text-sm font-bold tracking-widest text-gray-400 uppercase">
                                        Personal Data
                                    </h4>
                                    {selectedAppointment.type ===
                                    'company_bulk' ? (
                                        <div className="space-y-3">
                                            <div>
                                                <p className="flex items-center gap-1 text-[10px] text-gray-500">
                                                    <Mail className="h-3 w-3" />{' '}
                                                    Email
                                                </p>
                                                <p className="font-semibold">
                                                    {
                                                        selectedAppointment.user
                                                            .email
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <p className="flex items-center gap-1 text-[10px] text-gray-500">
                                                    <Phone className="h-3 w-3" />{' '}
                                                    Contact number
                                                </p>
                                                <p className="font-semibold">
                                                    {selectedAppointment.user
                                                        .contact ||
                                                        'Not provided'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <p className="text-[10px] text-gray-500">
                                                        Age / Sex
                                                    </p>
                                                    <p className="font-semibold">
                                                        {getAge(
                                                            selectedAppointment
                                                                .user
                                                                .patient_profile
                                                                ?.birthdate,
                                                        )}{' '}
                                                        /{' '}
                                                        {selectedAppointment
                                                            .user
                                                            .patient_profile
                                                            ?.sex || '?'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500">
                                                        Civil Status
                                                    </p>
                                                    <p className="font-semibold">
                                                        {selectedAppointment
                                                            .user
                                                            .patient_profile
                                                            ?.civil_status ||
                                                            'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="flex items-center gap-1 text-[10px] text-gray-500">
                                                    <Phone className="h-3 w-3" />{' '}
                                                    Contact
                                                </p>
                                                <p className="font-semibold">
                                                    {selectedAppointment.user
                                                        .contact || (
                                                        <span className="text-red-500">
                                                            Missing
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Checklist Card */}
                                <div className="flex min-w-0 flex-col justify-center rounded-xl border bg-white p-4">
                                    <h4 className="mb-4 text-center text-sm font-bold tracking-widest text-gray-400 uppercase">
                                        Readiness Checklist
                                    </h4>
                                    {selectedAppointment.type ===
                                    'company_bulk' ? (
                                        <div className="space-y-2 text-center">
                                            <div className="inline-flex rounded-full bg-orange-100 p-3 text-orange-600">
                                                <CheckCircle className="h-8 w-8" />
                                            </div>
                                            <p className="text-sm font-bold text-orange-700">
                                                Ready for Admin Approval
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Patient birthdate and sex are
                                                not required for a bulk request.
                                            </p>
                                        </div>
                                    ) : isComplete(selectedAppointment) ? (
                                        <div className="space-y-2 text-center">
                                            <div className="inline-flex rounded-full bg-green-100 p-3 text-green-600">
                                                <CheckCircle className="h-8 w-8" />
                                            </div>
                                            <p className="text-sm font-bold text-green-700">
                                                Ready for Doctor
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="mb-2 text-xs font-bold text-red-500">
                                                Required Fields Missing:
                                            </p>
                                            {getMissingFields(
                                                selectedAppointment,
                                            ).map((field) => (
                                                <div
                                                    key={field}
                                                    className="flex items-center gap-2 text-sm text-gray-600 italic"
                                                >
                                                    <XCircle className="h-4 w-4 text-red-400" />{' '}
                                                    {field}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 flex flex-wrap justify-end gap-3">
                                {/* CLOSE MODAL */}
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedAppointment(null)}
                                    className="flex-1"
                                >
                                    Close
                                </Button>

                                {/* ❌ CANCEL APPOINTMENT */}
                                {!['completed', 'cancelled'].includes(
                                    selectedAppointment.status,
                                ) && (
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            cancelAppointment(
                                                selectedAppointment.id,
                                            )
                                        }
                                        className="flex-1 gap-2"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Cancel Appointment
                                    </Button>
                                )}

                                {/* ✅ APPROVE */}
                                {selectedAppointment.status === 'pending' && (
                                    <Button
                                        onClick={() =>
                                            acceptAppointment(
                                                selectedAppointment.id,
                                            )
                                        }
                                        disabled={
                                            !isComplete(selectedAppointment)
                                        }
                                        className={`flex-1 gap-2 ${
                                            isComplete(selectedAppointment)
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : ''
                                        }`}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {selectedAppointment.type ===
                                        'company_bulk'
                                            ? 'Approve Bulk Request'
                                            : 'Approve & Forward'}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </>
    );
}

AdminAppointmentsIndex.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
