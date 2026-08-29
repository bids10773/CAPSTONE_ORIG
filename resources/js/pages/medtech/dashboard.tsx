import { Head, usePage, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    FlaskConical,
    Activity,
    Calendar,
    Clock,
    CheckCircle,
    Users,
} from 'lucide-react';
import { OnsiteOverviewCard } from '@/components/onsite-overview-card';
import type { OnsiteOverview } from '@/components/onsite-overview-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'MedTech Dashboard', href: '' },
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
    onsiteSummary: OnsiteOverview;
    pendingAppointments: Appointment[]; // 👈 ADD THIS
}

export default function MedTechDashboard(props: Props) {
    const { auth } = usePage().props as any;
    const {
        completedTests,
        pendingTests,
        pendingAppointments,
        todayCount,
        labCapacity,
        onsiteSummary,
    } = props;

    return (
        <>
            <Head title="MedTech Dashboard" />

            <div className="min-h-screen space-y-6 bg-gray-50 p-6">
                {/* HEADER */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Welcome,{' '}
                        <span className="text-moss-600">
                            Med Tech {auth?.user?.name || 'MedTech'}
                        </span>
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Here is your Laboratory practice overview for today.
                    </p>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            label: "Today's Patient",
                            value: todayCount,
                            icon: Users,
                            color: 'text-moss-600',
                            bg: 'bg-moss-50',
                        },
                        {
                            label: 'Pending Tests',
                            value: pendingTests,
                            icon: Clock,
                            color: 'text-orange-600',
                            bg: 'bg-orange-50',
                        },
                        {
                            label: 'Tests Completed',
                            value: completedTests,
                            icon: CheckCircle,
                            color: 'text-green-600',
                            bg: 'bg-green-50',
                        },
                        {
                            label: 'Lab Capacity',
                            value: labCapacity,
                            icon: Activity,
                            color: 'text-purple-600',
                            bg: 'bg-purple-50',
                        },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-xl hover:shadow-moss-500/5"
                        >
                            <div
                                className={`h-12 w-12 ${stat.bg} ${stat.color} mb-4 flex items-center justify-center rounded-2xl`}
                            >
                                <stat.icon size={24} />
                            </div>
                            <p className="text-sm font-medium text-gray-500">
                                {stat.label}
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">
                                {stat.value}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <OnsiteOverviewCard
                    summary={onsiteSummary}
                    href="/medtech/onsite-events"
                />

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* UPCOMING */}
                    <div className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md lg:col-span-2">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Upcoming Appointments
                            </h2>
                            <Link
                                href="/medtech/appointments"
                                className="text-sm font-bold text-moss-600 hover:underline"
                            >
                                View All
                            </Link>
                        </div>

                        {/* Placeholder (you can connect real list later) */}
                        <div className="space-y-4">
                            {pendingAppointments.length > 0 ? (
                                pendingAppointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center justify-between rounded-xl bg-gray-50/50 p-4 transition hover:bg-moss-50/30"
                                    >
                                        {/* LEFT */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-moss-100">
                                                <Calendar className="h-5 w-5 text-moss-600" />
                                            </div>

                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {apt.user.first_name}{' '}
                                                    {apt.user.last_name}
                                                </p>

                                                {/* SERVICE TAGS */}
                                                <div className="mt-1 flex flex-wrap gap-1">
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
                                                                            key={
                                                                                i
                                                                            }
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
                                                                    {
                                                                        apt.service_types
                                                                    }
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
                                                {new Date(
                                                    apt.appointment_date,
                                                ).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>

                                            <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-700">
                                                Pending
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl bg-gray-50/50 p-4 text-sm text-gray-500">
                                    No pending lab tests
                                </div>
                            )}
                        </div>
                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md">
                        <h2 className="mb-6 text-xl font-bold text-gray-900">
                            Quick Actions
                        </h2>

                        <div className="space-y-3">
                            <Link href="/medtech/appointments">
                                <button className="flex w-full items-center gap-3 rounded-xl bg-moss-500 p-4 font-bold text-white transition hover:bg-moss-700">
                                    <FlaskConical className="h-5 w-5" />
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
