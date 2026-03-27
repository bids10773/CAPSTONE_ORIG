import { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    Calendar, Plus, Search, Eye, CheckCircle, 
    XCircle, Clock, Filter, Building2, User 
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: "" },
];

interface AppointmentData {
    id: number;
    appointment_date: string;
    type: string;
    status: string;
    service_type: string;
    referral_code: string | null;
    user: { id: number; first_name: string; last_name: string; email: string; };
    company: { id: number; name: string; } | null;
}

export default function AppointmentsIndex() {
    const props = usePage().props as any;
    const { appointments, filters, can } = props;

    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [typeFilter, setTypeFilter] = useState(filters?.type || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const delayDebounce = setTimeout(() => {
            router.get('/appointments', {
                search, status: statusFilter, type: typeFilter,
            }, {
                preserveState: true, replace: true,
                onFinish: () => setLoading(false),
            });
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [search, statusFilter, typeFilter]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
            case 'accepted': return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800';
            case 'arrived': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
            case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            main: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <>
            <Head title="Appointments" />

            <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
                {/* PAGE HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Appointments</h1>
                        <p className="text-muted-foreground mt-1">Manage and track all patient clinical visits.</p>
                    </div>
                    {can?.create && (
                        <Link
                            href="/appointments/create"
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="font-semibold">New Appointment</span>
                        </Link>
                    )}
                </div>

                {/* SEARCH & FILTERS TOOLBAR */}
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className={cn(
                                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                loading ? "text-blue-500" : "text-gray-400 group-focus-within:text-blue-500"
                            )} />
                            <input
                                type="text"
                                placeholder="Search by patient name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-12 py-2.5 bg-gray-50 dark:bg-gray-900 border-transparent focus:border-blue-500 focus:ring-0 rounded-xl transition-all"
                            />
                            {loading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 px-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-transparent focus-within:border-blue-500">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-transparent border-none py-2.5 focus:ring-0 text-sm font-medium cursor-pointer"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="arrived">Arrived</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 px-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-transparent focus-within:border-blue-500">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="bg-transparent border-none py-2.5 focus:ring-0 text-sm font-medium cursor-pointer"
                                >
                                    <option value="">All Booking Types</option>
                                    <option value="individual">Individual</option>
                                    <option value="company_referral">Company Referral</option>
                                    <option value="company_bulk">Bulk Booking</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABLE CONTAINER */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Patient Details</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Date & Time</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Service / Type</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {appointments?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-400">
                                                    <Calendar className="w-8 h-8" />
                                                </div>
                                                <p className="text-gray-500 font-medium">No appointments match your criteria</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.data.map((appointment: AppointmentData) => {
                                        const dateInfo = formatDate(appointment.appointment_date);
                                        return (
                                            <tr key={appointment.id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-200 dark:border-blue-800">
                                                            {appointment.user.first_name[0]}{appointment.user.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 dark:text-white">
                                                                {appointment.user.first_name} {appointment.user.last_name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">{appointment.user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="font-medium text-gray-900 dark:text-white">{dateInfo.main}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {dateInfo.time}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{appointment.service_type}</div>
                                                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">
                                                        {appointment.type.replace('_', ' ')}
                                                    </div>
                                                    {appointment.company && (
                                                        <div className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                                                            <Building2 className="w-3 h-3" /> {appointment.company.name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors",
                                                        getStatusStyles(appointment.status)
                                                    )}>
                                                        {appointment.status === 'pending' && <Clock className="w-3 h-3" />}
                                                        {appointment.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                                        {appointment.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                                                        <span className="capitalize">{appointment.status}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/appointments/${appointment.id}`}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
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