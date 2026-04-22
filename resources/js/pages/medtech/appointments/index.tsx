import { Head, Link, router } from '@inertiajs/react';
import { 
    Search, 
    Filter, 
    Eye, 
    TestTube,
    Play
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Med Tech Queue', href: "/admin/companies" },
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

export default function MedTechAppointmentsIndex({ appointments, filters, pageTitle }: Props) {


    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'for_diagnostics':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending_diagnostics':
                return <TestTube className="w-4 h-4 text-purple-600" />;
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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusLabel = (status: string) => {
    switch (status) {
        case 'for_diagnostics': return 'Laboratory';
        case 'for_xray': return 'X-Ray';
        case 'for_final_evaluation': return 'Final Evaluation';
        default: return status.replace('_', ' ');
    }
};

    const startLabTest = (appointmentId: number) => {
        router.visit(`/medtech/lab-results/${appointmentId}`);
    };

    return (
        <>
             <Head title="MedTech Queue" />

            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TestTube className="w-6 h-6 text-blue-600" />
                            {pageTitle}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Process lab requests forwarded from the Doctor.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                    <form method="GET" className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                name="search"
                                defaultValue={filters.search}
                                placeholder="Search patient name..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select 
                            name="status" 
                            defaultValue={filters.status || 'pending_diagnostics'} 
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        >
                            <option value="pending_diagnostics">Waiting for Lab</option>
                            <option value="arrived">Arrived</option>
                            <option value="completed">Completed</option>
                        </select>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors">
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Patient</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Service</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {appointments.data.length > 0 ? (
                                    appointments.data.map((apt) => (
                                        <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{apt.user.first_name} {apt.user.last_name}</div>
                                                <div className="text-sm text-gray-500">{apt.user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{formatDate(apt.appointment_date)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{apt.service_type}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}>
                                                    {getStatusIcon(apt.status)}
                                                    {apt.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {apt.status === 'for_diagnostics' && !apt.labResult && (
                                                    <button
                                                        onClick={() => startLabTest(apt.id)}
                                                        className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm inline-flex items-center gap-1 transition-colors"
                                                    >
                                                        <Play className="w-3 h-3 fill-current" />
                                                        Encode Lab
                                                    </button>
                                                )}
                                                <Link href={`/appointments/${apt.id}`} className="p-2 text-gray-400 hover:text-blue-600 inline-flex items-center">
                                                    <Eye className="w-5 h-5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <TestTube className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                            <p className="text-lg font-medium">No pending lab requests found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination - Simplified version of your code to fix errors */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                         <p className="text-sm text-gray-700 dark:text-gray-300">
                            Total: <span className="font-medium">{appointments.total}</span> records
                        </p>
                        <div className="flex gap-2">
                            {appointments.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3 py-1 text-sm rounded ${link.active ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border dark:border-gray-600'} ${!link.url && 'opacity-50 pointer-events-none'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

MedTechAppointmentsIndex.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;