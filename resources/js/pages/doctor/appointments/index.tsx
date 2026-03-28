import { Head, Link, usePage, router } from '@inertiajs/react';
import { 
    Calendar, 
    Search, 
    Filter, 
    Eye, 
    Stethoscope,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Play
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

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

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        switch (s) {
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
        const s = status.toLowerCase();
        switch (s) {
            case 'pending':
                return <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
            case 'accepted':
                return <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
            case 'arrived':
                return <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
            default:
                return null;
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

    const startExam = (appointmentId: number) => {
        router.visit(`/doctor/physical-exam-form/${appointmentId}`);
    };

    return (
        <>
            <Head title={`${pageTitle} - Doctor`} />

            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-6 h-6" />
                            {pageTitle}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Pending appointments ready for physical examination
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
                            <option value="arrived">Arrived</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="accepted">Accepted</option>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
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
                                                {appointment.service_type}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {getTypeLabel(appointment.type)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {appointment.company?.company_name || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                                                    {getStatusIcon(appointment.status)}
                                                    {appointment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                                <Link 
                                                    href={`/appointments/${appointment.id}`} 
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg inline-flex items-center"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>

                                                {/* FIXED LOGIC: Show exam button if status is accepted/arrived AND no exam exists */}
                                                {(['accepted', 'arrived'].includes(appointment.status.toLowerCase())) && !appointment.physical_exam?.id && (
                                                    <button
                                                        onClick={() => startExam(appointment.id)}
                                                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg inline-flex items-center"
                                                        title="Start Physical Exam"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                No pending appointments
                                            </h3>
                                            <p className="text-sm">
                                                All appointments are up to date. Check back later for new bookings.
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
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Showing <span className="font-medium">{(appointments.current_page - 1) * appointments.per_page + 1}</span> to <span className="font-medium">{Math.min(appointments.current_page * appointments.per_page, appointments.total)}</span> of{' '}
                                            <span className="font-medium">{appointments.total}</span> results
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        {appointments.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || ''}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:z-20 focus:outline-none ${
                                                    link.active
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300'
                                                } ${!link.url && 'pointer-events-none text-gray-400'}`}
                                            />
                                        ))}
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
    return <AppLayout>{page}</AppLayout>;
};