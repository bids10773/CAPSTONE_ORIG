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
        transition: {
            staggerChildren: 0.15
        }
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
    const { stats, recentAppointments, appointmentsByStatus, appointmentsByType, monthlyTrends } = props;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'arrived':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
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

                {/* HEADER */}

                <motion.div variants={item}>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Admin Dashboard
                    </h1>

                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                        Manage your clinic operations and view analytics
                    </p>
                </motion.div>


                {/* TOP STATS */}

                <motion.div
                    variants={container}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >

                    <motion.div variants={card} whileHover={{ scale: 1.04 }} className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Today's Appointments
                        </p>

                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {stats?.todayAppointments || 0}
                        </p>

                        <Calendar className="w-6 h-6 text-blue-600 mt-3"/>
                    </motion.div>


                    <motion.div variants={card} whileHover={{ scale: 1.04 }} className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Total Staff
                        </p>

                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {stats?.totalStaff || 0}
                        </p>

                        <Users className="w-6 h-6 text-purple-600 mt-3"/>
                    </motion.div>


                    <motion.div variants={card} whileHover={{ scale: 1.04 }} className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Partnered Companies
                        </p>

                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {stats?.totalCompanies || 0}
                        </p>

                        <Building2 className="w-6 h-6 text-green-600 mt-3"/>
                    </motion.div>


                    <motion.div variants={card} whileHover={{ scale: 1.04 }} className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Total Patients
                        </p>

                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {stats?.totalPatients || 0}
                        </p>

                        <Activity className="w-6 h-6 text-orange-600 mt-3"/>
                    </motion.div>

                </motion.div>



                {/* CHARTS */}

                <motion.div variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* STATUS */}

                    <motion.div variants={card} className="bg-white dark:bg-gray-800 border rounded-lg p-6">

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Appointments by Status
                        </h3>

                        {Object.entries(appointmentsByStatus || {}).map(([status, count]) => {

                            const c = Number(count);
                            const pct = totalStatus > 0 ? (c / totalStatus) * 100 : 0;

                            return (
                                <div key={status} className="flex justify-between mb-3">

                                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                        {status}
                                    </span>

                                    <div className="flex items-center gap-2">

                                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded">

                                            <motion.div
                                                className="h-2 bg-blue-500 rounded"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6 }}
                                            />

                                        </div>

                                        <span className="text-sm text-gray-900 dark:text-white">
                                            {c}
                                        </span>

                                    </div>
                                </div>
                            );
                        })}

                    </motion.div>



                    {/* TYPE */}

                    <motion.div variants={card} className="bg-white dark:bg-gray-800 border rounded-lg p-6">

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Appointments by Type
                        </h3>

                        {Object.entries(appointmentsByType || {}).map(([type, count]) => {

                            const c = Number(count);
                            const pct = totalType > 0 ? (c / totalType) * 100 : 0;

                            return (
                                <div key={type} className="flex justify-between mb-3">

                                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                        {type}
                                    </span>

                                    <div className="flex items-center gap-2">

                                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded">

                                            <motion.div
                                                className="h-2 bg-blue-500 rounded"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6 }}
                                            />

                                        </div>

                                        <span className="text-sm text-gray-900 dark:text-white">
                                            {c}
                                        </span>

                                    </div>
                                </div>
                            );
                        })}

                    </motion.div>

                </motion.div>



                {/* MONTHLY TREND */}

                <motion.div variants={card} className="bg-white dark:bg-gray-800 border rounded-lg p-6">

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Monthly Appointment Trends
                    </h3>

                    <div className="flex items-end gap-2 h-40">

                        {(monthlyTrends || []).map((trend: any, index: number) => {

                            const trendCounts = monthlyTrends.map((t: any) => t.count);
                            const maxCount = Math.max(...trendCounts, 1);
                            const heightPercent = (trend.count / maxCount) * 100;

                            return (
                                <div key={index} className="flex-1 flex flex-col items-center">

                                    <motion.div
                                        className="w-full bg-blue-500 rounded-t"
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPercent}%` }}
                                        transition={{ duration: 0.6 }}
                                    />

                                    <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                        {trend.month}
                                    </span>

                                </div>
                            );
                        })}
                    </div>

                </motion.div>



                {/* RECENT APPOINTMENTS */}

                <motion.div variants={card} className="bg-white dark:bg-gray-800 border rounded-lg">

                    <div className="p-6 border-b flex justify-between">

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Appointments
                        </h3>

                        <Link
                            href="/admin/appointments"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            View All <ArrowRight className="w-4 h-4"/>
                        </Link>

                    </div>

                    <motion.div
                        variants={container}
                        className="p-6 space-y-4"
                    >

                        {recentAppointments?.map((appointment: AppointmentData) => (

                            <motion.div
                                variants={item}
                                key={appointment.id}
                                whileHover={{ scale: 1.02 }}
                                className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                            >

                                <div>

                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {appointment.user?.first_name} {appointment.user?.last_name}
                                    </p>

                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(appointment.appointment_date)}
                                    </p>

                                </div>

                                <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(appointment.status)}`}>
                                    {appointment.status}
                                </span>

                            </motion.div>

                        ))}

                    </motion.div>

                </motion.div>

            </motion.div>
        </>
    );
}

AdminDashboard.layout = (page: any) => {
    return <AppLayout>{page}</AppLayout>;
};