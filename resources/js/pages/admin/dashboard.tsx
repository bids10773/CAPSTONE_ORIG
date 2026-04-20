import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    Users,
    Building2,
    Activity,
    ArrowRight
} from 'lucide-react';

import { motion } from "framer-motion";
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: "",
    },
];

interface AppointmentData {
    id: number;
    appointment_date: string;
    status: string;
    type: string;
    service_type: string;
    user: {
        first_name: string;
        last_name: string;
    };
    company: {
        company_name: string;
    } | null;
}

/* ANIMATION VARIANTS */

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 }
    }
};

const card = {
    hidden: { opacity: 0, y: 30 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
};

export default function AdminDashboard() {

    const props = usePage().props as any;
    const { stats, historyAppointments, recentAppointments, todayAppointments, appointmentsByStatus, appointmentsByType, monthlyTrends } = props;


    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusValues = Object.values(appointmentsByStatus || {});
    const typeValues = Object.values(appointmentsByType || {});
    const totalStatus = Number(statusValues.reduce((a, b) => Number(a) + Number(b), 0)) || 1;
    const totalType = Number(typeValues.reduce((a, b) => Number(a) + Number(b), 0)) || 1;

    return (
        <>
            <Head title="Admin Dashboard" />

            <motion.div
                className="p-6 space-y-6"
                variants={container}
                initial="hidden"
                animate="show"
            >

                {/* TOP STATS */}
                <motion.div
                    variants={container}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >

                    {[{
                        label: "Today's Appointments",
                        value: stats?.todayAppointments || 0,
                        icon: <Calendar className="w-6 h-6 text-blue-600 mt-3"/>
                    },
                    {
                        label: "Total Staff",
                        value: stats?.totalStaff || 0,
                        icon: <Users className="w-6 h-6 text-purple-600 mt-3"/>
                    },
                    {
                        label: "Partnered Companies",
                        value: stats?.totalCompanies || 0,
                        icon: <Building2 className="w-6 h-6 text-green-600 mt-3"/>
                    },
                    {
                        label: "Total Patients",
                        value: stats?.totalPatients || 0,
                        icon: <Activity className="w-6 h-6 text-orange-600 mt-3"/>
                    }].map((cardItem, index) => (

                        <motion.div
                            key={index}
                            variants={card}
                            whileHover={{ scale: 1.04 }}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition"
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {cardItem.label}
                            </p>

                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                {cardItem.value}
                            </p>

                            {cardItem.icon}
                        </motion.div>

                    ))}

                </motion.div>

                {/* CHARTS */}
                <motion.div variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">

                    {/* STATUS */}
                    <motion.div variants={card} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Appointments by Status
                        </h3>

                        {Object.entries(appointmentsByStatus || {}).map(([status, count]) => {
                            const c = Number(count);
                            const pct = totalStatus > 0 ? (c / totalStatus) * 100 : 0;

                            return (
                                <div key={status} className="flex justify-between mb-4">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                        {status}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded">
                                            <motion.div
                                                className="h-2 bg-blue-500 rounded"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-900 dark:text-white">{c}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>

                    {/* TYPE */}
                    <motion.div variants={card} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Appointments by Type
                        </h3>

                        {Object.entries(appointmentsByType || {}).map(([type, count]) => {
                            const c = Number(count);
                            const pct = totalType > 0 ? (c / totalType) * 100 : 0;

                            return (
                                <div key={type} className="flex justify-between mb-4">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                        {type}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded">
                                            <motion.div
                                                className="h-2 bg-blue-500 rounded"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-900 dark:text-white">{c}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>

                </motion.div>

               {/* MONTHLY TREND WITH LEVEL 3 ML PREDICTIONS */}
<motion.div variants={card} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
    <div className="flex justify-between items-center mb-6">
        <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Predictive Resource Analytics
            </h3>
            <p className="text-xs text-gray-500">Holt-Winters Seasonal Forecast (Confidence Interval: ±1 Std Dev)</p>
        </div>
        <div className="flex gap-4 text-[10px] font-medium">
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Actual</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-400 border border-dashed border-purple-600 rounded-full"></span> Forecast</div>
        </div>
    </div>

    <div className="flex items-end gap-3 h-56 pt-10"> {/* Increased height for labels */}
        {(monthlyTrends || []).map((trend: any, index: number) => {
            const counts = monthlyTrends.map((t: any) => t.upper_bound || t.count);
            const maxCount = Math.max(...counts, 1);
            
            const heightPercent = (trend.count / maxCount) * 100;
            const upperPercent = trend.is_predicted ? (trend.upper_bound / maxCount) * 100 : 0;
            const isPredicted = trend.is_predicted;

            return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                    
                    {/* Level 3: Confidence Interval (The Ghost Bar) */}
                    {isPredicted && (
                        <motion.div 
                            className="absolute bottom-6 w-full bg-purple-200/20 border-x border-t border-dashed border-purple-300/40 rounded-t-md"
                            initial={{ height: 0 }}
                            animate={{ height: `calc(${upperPercent}% - 24px)` }} // Subtract label space
                            style={{ zIndex: 0 }}
                        />
                    )}

                    {/* Prediction Stats Tooltip */}
                    <div className="absolute -top-14 bg-gray-900 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none min-w-[120px] shadow-xl">
                        <p className="font-bold border-b border-gray-700 mb-1">{trend.month}</p>
                        <p>Expected: {trend.count}</p>
                        {isPredicted && (
                            <>
                                <p className="text-purple-300">Max Cap: {trend.upper_bound}</p>
                                <p className="text-blue-300">Confidence: {trend.confidence}%</p>
                            </>
                        )}
                    </div>

                    {/* Main Bar */}
                    <motion.div
                        className={`w-full rounded-t-md relative z-10 transition-all duration-500 ${
                            isPredicted 
                            ? 'bg-gradient-to-t from-purple-500/80 to-purple-400/60 border-t-2 border-dashed border-purple-300 shadow-lg shadow-purple-500/20' 
                            : 'bg-blue-600 shadow-sm'
                        }`}
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        whileHover={{ scaleX: 1.05 }}
                    />
                    
                    <div className="flex flex-col items-center h-6">
                        <span className={`text-[9px] uppercase tracking-tighter ${isPredicted ? 'text-purple-500 font-bold' : 'text-gray-400'}`}>
                            {trend.month?.split(' ')[0]}
                        </span>
                        {isPredicted && <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>}
                    </div>
                </div>
            );
        })}
    </div>
</motion.div>

                {/* TODAY */}
                <motion.div variants={card} className="bg-white border border-blue-300 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-blue-300">
                        <h3 className="text-lg font-semibold text-blue-600">
                            Today's Appointments
                        </h3>
                    </div>

                    <div className="p-6 space-y-4 max-h-[250px] overflow-y-auto">
                        {todayAppointments?.length > 0 ? (
                            todayAppointments.map((appointment: AppointmentData) => (
                                <div key={appointment.id} className="flex justify-between bg-blue-50 p-4 rounded-lg">
                                    <div>
                                        <p className="font-medium">
                                            {appointment.user.first_name} {appointment.user.last_name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(appointment.appointment_date)}
                                        </p>
                                    </div>

                                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusBadge(appointment.status)}`}>
                                        {appointment.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p>No appointments today.</p>
                        )}
                    </div>
                </motion.div>

                {/* RECENT + HISTORY */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* RECENT */}
                    <motion.div variants={card} className="bg-white rounded-xl shadow-sm">
                        <div className="p-6 border-b flex justify-between">
                            <h3 className="text-lg font-semibold">Recent Appointments</h3>
                            <Link href="/admin/appointments" className="text-blue-600 flex items-center gap-2">
                                View All <ArrowRight className="w-4 h-4"/>
                            </Link>
                        </div>

                        <div className="p-6 space-y-4 max-h-[250px] overflow-y-auto">
                            {recentAppointments?.map((appointment: AppointmentData) => (
                                <div key={appointment.id} className="flex justify-between bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="font-medium">
                                            {appointment.user.first_name} {appointment.user.last_name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(appointment.appointment_date)}
                                        </p>
                                    </div>

                                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusBadge(appointment.status)}`}>
                                        {appointment.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* HISTORY */}
                    <motion.div variants={card} className="bg-white border border-green-300 rounded-xl shadow-sm">
                        <div className="p-6 border-b border-green-300">
                            <h3 className="text-lg font-semibold text-green-600">
                                Appointment History
                            </h3>
                        </div>

                        <div className="p-6 space-y-4 max-h-[250px] overflow-y-auto">
                            {historyAppointments?.length > 0 ? (
                                historyAppointments.map((appointment: AppointmentData) => (
                                    <div key={appointment.id} className="flex justify-between bg-green-50 p-4 rounded-lg">
                                        <div>
                                            <p className="font-medium">
                                                {appointment.user.first_name} {appointment.user.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(appointment.appointment_date)}
                                            </p>
                                        </div>

                                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                            completed
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p>No history yet.</p>
                            )}
                        </div>
                    </motion.div>
            </div>
            </motion.div>
            
        </>
    );
}

AdminDashboard.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};