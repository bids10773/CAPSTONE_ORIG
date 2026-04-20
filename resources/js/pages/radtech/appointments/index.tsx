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
    Play
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'RadTech Queue', href: "/admin/companies" },
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'for_xray':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'for_xray':
                return <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
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
        const parsed = typeof service === 'string' ? JSON.parse(service) : service;
        return Array.isArray(parsed) ? parsed.join(', ') : parsed;
    } catch {
        return service;
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'for_diagnostics': return 'Laboratory';
        case 'for_xray': return 'X-Ray';
        case 'for_final_evaluation': return 'Final Evaluation';
        default: return status.replace('_', ' ');
    }
};

    const startXray = (appointmentId: number) => {
        router.visit(`/radtech/xrays/${appointmentId}`);
    };

    return (
        <>
            <Head title={`${pageTitle} - RadTech`} />

            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-6 h-6" />
                            {pageTitle}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            X-Ray requests pending processing
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                    <form method="GET" className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Search patient name..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <select name="status" defaultValue={filters.status} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                            <option value="pending">Pending Only</option>
                            <option value="accepted">Accepted</option>
                            <option value="arrived">Arrived</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <button type="submit" className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Service
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {appointments.data.length > 0 ? (
                                    appointments.data.map((appointment) => (
                                        <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {appointment.user.first_name} {appointment.user.last_name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {appointment.user.email}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white">
                                                {formatDate(appointment.appointment_date)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white">
                                                {formatService(appointment.service_types)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {getTypeLabel(appointment.type)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {appointment.company?.company_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                                                    {getStatusIcon(appointment.status)}
                                                    {getStatusLabel(appointment.status)}
                                                </span>
                                            </td>
                                            {/* ACTION */}
                        <td className="px-6 py-4 text-right flex justify-end gap-2">

                            {appointment.status === 'for_xray' && !appointment.xrayReport && (
                                <button
                                    onClick={() => startXray(appointment.id)}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 shadow"
                                >
                                    <Play className="w-3 h-3" />
                                    Start
                                </button>
                            )}

                            <Link
                                href={`/appointments/${appointment.id}`}
                                className="p-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Eye className="w-4 h-4" />
                            </Link>

                        </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                No pending X-Ray requests
                                            </h3>
                                            <p className="text-sm">
                                                Check back later for new imaging requests.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {appointments.links && appointments.links.length > 3 && (
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                            <nav className="flex items-center justify-between">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <Link href={appointments.links[0]?.url || ''} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                        Previous
                                    </Link>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Showing <span className="font-medium">{(appointments.current_page - 1) * appointments.per_page + 1}</span> to <span className="font-medium">{Math.min(appointments.current_page * appointments.per_page, appointments.total)}</span> of{' '}
                                            <span className="font-medium">{appointments.total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        {appointments.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || ''}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:z-20 focus:outline-none ${
                                                    link.active
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300'
                                                } ${!link.url && 'pointer-events-none text-gray-400'}`}
                                            >
                                                {link.label === 'Previous' && <ChevronLeft className="w-5 h-5" />}
                                                {link.label === 'Next' && <ChevronRight className="w-5 h-5" />}
                                                {link.label.replace(/\\w/g, '')}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-1 justify-end sm:hidden">
                                    <Link href={appointments.links[appointments.links.length - 1]?.url || ''} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
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

