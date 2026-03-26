import { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, Plus, Search, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appointments',
        href: "",
    },
];

interface AppointmentData {
    id: number;
    appointment_date: string;
    type: string;
    status: string;
    service_type: string;
    referral_code: string | null;
    user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
    company: {
        id: number;
        name: string;
    } | null;
}

export default function AppointmentsIndex() {
    const props = usePage().props as any;
    const { appointments, filters, can } = props;

    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [typeFilter, setTypeFilter] = useState(filters?.type || '');
    const [loading, setLoading] = useState(false);

    // ✅ AUTO SEARCH (Debounced)
    useEffect(() => {
        setLoading(true);

        const delayDebounce = setTimeout(() => {
            router.get('/appointments', {
                search,
                status: statusFilter,
                type: typeFilter,
            }, {
                preserveState: true,
                replace: true,
                onFinish: () => setLoading(false),
            });
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [search, statusFilter, typeFilter]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'accepted':
                return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
            case 'arrived':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'accepted':
                return <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
            case 'arrived':
                return <CheckCircle className="w-4 h-4" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4" />;
            default:
                return null;
        }
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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title="Appointments" />

            <div className="p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">

                    
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">

                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by patient name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 
                                border border-gray-300 dark:border-gray-600 
                                bg-white dark:bg-gray-700 
                                text-gray-900 dark:text-gray-100 
                                rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            {loading && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                    Searching...
                                </span>
                            )}
                        </div>

                        {/* Status */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 
                            bg-white dark:bg-gray-700 
                            text-gray-900 dark:text-gray-100 
                            rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="arrived">Arrived</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="accepted">Accepted</option>
                        </select>

                        {/* Type */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 
                            bg-white dark:bg-gray-700 
                            text-gray-900 dark:text-gray-100 
                            rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            <option value="individual">Individual</option>
                            <option value="company_referral">Company Referral</option>
                            <option value="company_bulk">Bulk Booking</option>
                        </select>


                        {can?.create && (
                        <Link
                            href="/appointments/create"
                            className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Book Appointment
                        </Link>
                    )}

                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">

                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-300 uppercase">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-300 uppercase">Patient</th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-300 uppercase">Service</th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-300 uppercase">Company</th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {appointments?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No appointments found
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.data.map((appointment: AppointmentData) => (
                                        <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">

                                            <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                                                {formatDate(appointment.appointment_date)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    {appointment.user.first_name} {appointment.user.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {appointment.user.email}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                                                {appointment.service_type}
                                            </td>

                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {getTypeLabel(appointment.type)}
                                            </td>

                                            <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                                                {appointment.company?.name || '-'}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                                                    {getStatusIcon(appointment.status)}
                                                    {appointment.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/appointments/${appointment.id}`}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    <Eye className="w-4 h-4 inline" /> View
                                                </Link>
                                            </td>

                                        </tr>
                                    ))
                                )}
                            </tbody>

                        </table>
                    </div>
                </div>

            </div>
        </>
    );
}

AppointmentsIndex.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;