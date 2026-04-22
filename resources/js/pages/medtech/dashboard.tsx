import { Head, usePage, Link} from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { motion } from 'framer-motion';
import { FlaskConical, Activity, Calendar, Clock, CheckCircle, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'MedTech Dashboard', href: "" },
];

interface Appointment {
    id: number;
    appointment_date: string;
    service_types: string;
    user: {
        first_name: string;
        last_name: string;
    };
}

interface Props {
    completedTests: number;
    pendingTests: number;
    labCapacity: string;
    todayCount: number;
    pendingAppointments: Appointment[]; // 👈 ADD THIS
}

export default function MedTechDashboard(props: Props) {
    const { auth } = usePage().props as any;
    const { completedTests, pendingTests, pendingAppointments, todayCount, labCapacity } = props;

    return (
        <>
            <Head title="MedTech Dashboard" />

            <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

                {/* HEADER */}
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Welcome, <span className="text-[#246AFE]">
                            Med Tech {auth?.user?.name || 'MedTech'}
                        </span>
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Here is your Laboratory practice overview for today.
                    </p>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        {label: "Today's Patient", value: todayCount, icon: Users ,color: 'text-blue-600', bg: 'bg-blue-50'},
                        { label: 'Pending Tests', value: pendingTests, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Tests Completed', value: completedTests, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Lab Capacity', value: labCapacity, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/60 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all"
                        >
                            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                                <stat.icon size={24} />
                            </div>
                            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* UPCOMING */}
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-md border border-white rounded-[2rem] p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-gray-900">Upcoming Appointments</h2>
                        <Link href="/medtech/appointments" className="text-sm font-bold text-[#246AFE] hover:underline">
                            View All
                        </Link>
                    </div>

                        {/* Placeholder (you can connect real list later) */}
                       <div className="space-y-4">
    {pendingAppointments.length > 0 ? (
        pendingAppointments.map((apt) => (
            <div
                key={apt.id}
                className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-blue-50/30 transition"
            >
                {/* LEFT */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                    </div>

                    <div>
                        <p className="font-bold text-gray-900">
                            {apt.user.first_name} {apt.user.last_name}
                        </p>

                        {/* SERVICE TAGS */}
                        <div className="flex flex-wrap gap-1 mt-1">
                            {(() => {
                                try {
                                    const parsed = typeof apt.service_types === 'string'
                                        ? JSON.parse(apt.service_types)
                                        : apt.service_types;

                                    return Array.isArray(parsed)
                                        ? parsed.map((s: string, i: number) => (
                                            <span key={i} className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                                {s}
                                            </span>
                                        ))
                                        : (
                                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                                {parsed}
                                            </span>
                                        );
                                } catch {
                                    return (
                                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                            {apt.service_types}
                                        </span>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="text-right">
                    <p className="text-sm text-gray-500">
                        {new Date(apt.appointment_date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>

                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                        Pending
                    </span>
                </div>
            </div>
        ))
    ) : (
        <div className="p-4 bg-gray-50/50 rounded-xl text-gray-500 text-sm">
            No pending lab tests
        </div>
    )}
</div>
                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="bg-white/60 backdrop-blur-md border border-white rounded-[2rem] p-6 shadow-sm">
                        <h2 className="text-xl font-black text-gray-900 mb-6">Quick Actions</h2>

                        <div className="space-y-3">
                            <Link href="/medtech/appointments">
                            <button className="w-full flex items-center gap-3 p-4 bg-[#246AFE] text-white rounded-xl font-bold hover:bg-blue-700 transition">
                                <FlaskConical className="w-5 h-5" />
                                New Lab Request
                            </button>
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

MedTechDashboard.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};