import { Head, Link, usePage } from '@inertiajs/react';
import { Calendar, Users, Building2, Activity, ArrowRight } from 'lucide-react';

import { motion } from 'framer-motion';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '',
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
        transition: { staggerChildren: 0.15 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 },
    },
};

const card = {
    hidden: { opacity: 0, y: 30 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
    },
};

export default function AdminDashboard() {
    const props = usePage().props as any;
    const {
        stats,
        historyAppointments,
        recentAppointments,
        todayAppointments,
        appointmentsByStatus,
        appointmentsByType,
        monthlyTrends,
    } = props;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'arrived':
                return 'bg-moss-100 text-moss-800';
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
    const totalStatus =
        Number(statusValues.reduce((a, b) => Number(a) + Number(b), 0)) || 1;
    const totalType =
        Number(typeValues.reduce((a, b) => Number(a) + Number(b), 0)) || 1;

    return (
        <>
            <Head title="Admin Dashboard" />

            <motion.div
                className="space-y-6 p-6"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* TOP STATS */}
                <motion.div
                    variants={container}
                    className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
                >
                    {[
                        {
                            label: "Today's Appointments",
                            value: stats?.todayAppointments || 0,
                            icon: (
                                <Calendar className="mt-3 h-6 w-6 text-moss-600" />
                            ),
                        },
                        {
                            label: 'Total Staff',
                            value: stats?.totalStaff || 0,
                            icon: (
                                <Users className="mt-3 h-6 w-6 text-purple-600" />
                            ),
                        },
                        {
                            label: 'Partnered Companies',
                            value: stats?.totalCompanies || 0,
                            icon: (
                                <Building2 className="mt-3 h-6 w-6 text-green-600" />
                            ),
                        },
                        {
                            label: 'Total Patients',
                            value: stats?.totalPatients || 0,
                            icon: (
                                <Activity className="mt-3 h-6 w-6 text-orange-600" />
                            ),
                        },
                    ].map((cardItem, index) => (
                        <motion.div
                            key={index}
                            variants={card}
                            whileHover={{ scale: 1.04 }}
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                        >
                            <p className="text-sm text-gray-600">
                                {cardItem.label}
                            </p>

                            <p className="mt-1 text-3xl font-bold text-gray-900">
                                {cardItem.value}
                            </p>

                            {cardItem.icon}
                        </motion.div>
                    ))}
                </motion.div>

                {/* CHARTS */}
                <motion.div
                    variants={container}
                    className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2"
                >
                    {/* STATUS */}
                    <motion.div
                        variants={card}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Appointments by Status
                        </h3>

                        {Object.entries(appointmentsByStatus || {}).map(
                            ([status, count]) => {
                                const c = Number(count);
                                const pct =
                                    totalStatus > 0
                                        ? (c / totalStatus) * 100
                                        : 0;

                                return (
                                    <div
                                        key={status}
                                        className="mb-4 flex justify-between"
                                    >
                                        <span className="text-sm text-gray-700 capitalize">
                                            {status}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-32 rounded bg-gray-200">
                                                <motion.div
                                                    className="h-2 rounded bg-moss-500"
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${pct}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-900">
                                                {c}
                                            </span>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </motion.div>

                    {/* TYPE */}
                    <motion.div
                        variants={card}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Appointments by Type
                        </h3>

                        {Object.entries(appointmentsByType || {}).map(
                            ([type, count]) => {
                                const c = Number(count);
                                const pct =
                                    totalType > 0 ? (c / totalType) * 100 : 0;

                                return (
                                    <div
                                        key={type}
                                        className="mb-4 flex justify-between"
                                    >
                                        <span className="text-sm text-gray-700 capitalize">
                                            {type}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-32 rounded bg-gray-200">
                                                <motion.div
                                                    className="h-2 rounded bg-moss-500"
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${pct}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-900">
                                                {c}
                                            </span>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </motion.div>
                </motion.div>

                {/* MONTHLY TREND WITH LEVEL 3 ML PREDICTIONS */}
                <motion.div
                    variants={card}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        Predictive Monthly Trends
                    </h3>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="month" />
                            <YAxis />

                            <Tooltip />

                            {/* ACTUAL */}
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#16a34a"
                                strokeWidth={3}
                            />

                            {/* UPPER */}
                            <Line
                                type="monotone"
                                dataKey="upper_bound"
                                stroke="#a855f7"
                                strokeDasharray="5 5"
                            />

                            {/* LOWER */}
                            <Line
                                type="monotone"
                                dataKey="lower_bound"
                                stroke="#ef4444"
                                strokeDasharray="5 5"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* TODAY */}
                <motion.div
                    variants={card}
                    className="rounded-xl border border-moss-300 bg-white shadow-sm"
                >
                    <div className="border-b border-moss-300 p-6">
                        <h3 className="text-lg font-semibold text-moss-600">
                            Today's Appointments
                        </h3>
                    </div>

                    <div className="max-h-[250px] space-y-4 overflow-y-auto p-6">
                        {todayAppointments?.length > 0 ? (
                            todayAppointments.map(
                                (appointment: AppointmentData) => (
                                    <div
                                        key={appointment.id}
                                        className="flex justify-between rounded-lg bg-moss-50 p-4"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {appointment.user.first_name}{' '}
                                                {appointment.user.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(
                                                    appointment.appointment_date,
                                                )}
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs ${getStatusBadge(appointment.status)}`}
                                        >
                                            {appointment.status}
                                        </span>
                                    </div>
                                ),
                            )
                        ) : (
                            <p>No appointments today.</p>
                        )}
                    </div>
                </motion.div>

                {/* RECENT + HISTORY */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* RECENT */}
                    <motion.div
                        variants={card}
                        className="rounded-xl bg-white shadow-sm"
                    >
                        <div className="flex justify-between border-b p-6">
                            <h3 className="text-lg font-semibold">
                                Recent Appointments
                            </h3>
                            <Link
                                href="/admin/appointments"
                                className="flex items-center gap-2 text-moss-600"
                            >
                                View All <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="max-h-[250px] space-y-4 overflow-y-auto p-6">
                            {recentAppointments?.map(
                                (appointment: AppointmentData) => (
                                    <div
                                        key={appointment.id}
                                        className="flex justify-between rounded-lg bg-gray-50 p-4"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {appointment.user.first_name}{' '}
                                                {appointment.user.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(
                                                    appointment.appointment_date,
                                                )}
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs ${getStatusBadge(appointment.status)}`}
                                        >
                                            {appointment.status}
                                        </span>
                                    </div>
                                ),
                            )}
                        </div>
                    </motion.div>

                    {/* HISTORY */}
                    <motion.div
                        variants={card}
                        className="rounded-xl border border-green-300 bg-white shadow-sm"
                    >
                        <div className="border-b border-green-300 p-6">
                            <h3 className="text-lg font-semibold text-green-600">
                                Appointment History
                            </h3>
                        </div>

                        <div className="max-h-[250px] space-y-4 overflow-y-auto p-6">
                            {historyAppointments?.length > 0 ? (
                                historyAppointments.map(
                                    (appointment: AppointmentData) => (
                                        <div
                                            key={appointment.id}
                                            className="flex justify-between rounded-lg bg-green-50 p-4"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {
                                                        appointment.user
                                                            .first_name
                                                    }{' '}
                                                    {appointment.user.last_name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(
                                                        appointment.appointment_date,
                                                    )}
                                                </p>
                                            </div>

                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
                                                completed
                                            </span>
                                        </div>
                                    ),
                                )
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
