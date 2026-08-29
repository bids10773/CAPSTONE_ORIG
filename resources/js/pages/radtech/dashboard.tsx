import { Head, usePage, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Users, Clock, CheckCircle } from 'lucide-react';
import { OnsiteOverviewCard } from '@/components/onsite-overview-card';
import type { OnsiteOverview } from '@/components/onsite-overview-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'RadTech Dashboard', href: '' },
];

interface Appointment {
    id: number;
    appointment_date: string;
    service_types: any;
    user: {
        first_name: string;
        last_name: string;
    };
}

interface Props {
    completedScans: number;
    pendingScans: number;
    todayScans: number;
    onsiteSummary: OnsiteOverview;
    pendingAppointments: Appointment[];
}

export default function RadTechDashboard({
    completedScans = 0,
    pendingScans = 0,
    todayScans = 0,
    onsiteSummary,
    pendingAppointments = [],
}: Props) {
    const { auth } = usePage().props as any;

    return (
        <>
            <Head title="RadTech Dashboard" />

            {/* ✅ MAIN WRAPPER */}
            <div className="min-h-screen space-y-6 bg-gray-50 p-6">
                {/* HEADER */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome,{' '}
                        <span className="text-moss-600">
                            Rad Tech {auth?.user?.name || 'RadTech'}
                        </span>
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Here is your medical practice overview for today.
                    </p>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            label: "Today's Scans",
                            value: todayScans,
                            icon: Users,
                            color: 'text-moss-600',
                            bg: 'bg-moss-50',
                        },
                        {
                            label: 'Pending Scans',
                            value: pendingScans,
                            icon: Clock,
                            color: 'text-orange-600',
                            bg: 'bg-orange-50',
                        },
                        {
                            label: 'Completed Scans',
                            value: completedScans,
                            icon: CheckCircle,
                            color: 'text-green-600',
                            bg: 'bg-green-50',
                        },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-xl"
                        >
                            <div
                                className={`h-12 w-12 ${stat.bg} ${stat.color} mb-4 flex items-center justify-center rounded-2xl`}
                            >
                                <stat.icon size={24} />
                            </div>
                            <p className="text-sm text-gray-500">
                                {stat.label}
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">
                                {stat.value}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* ✅ MAIN GRID (FIXED POSITION) */}
                <OnsiteOverviewCard
                    summary={onsiteSummary}
                    href="/radtech/onsite-events"
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* UPCOMING SCANS */}
                    <div className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md lg:col-span-2">
                        <h2 className="mb-6 text-xl font-bold text-gray-900">
                            Upcoming Scans
                        </h2>

                        <div className="space-y-4">
                            {pendingAppointments.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="flex items-center justify-between rounded-xl bg-gray-50/50 p-4 transition hover:bg-moss-50/30"
                                >
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {apt.user.first_name}{' '}
                                            {apt.user.last_name}
                                        </p>

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
                                                                    key={i}
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
                                                            {apt.service_types}
                                                        </span>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    </div>

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
                            ))}

                            {/* EMPTY STATE */}
                            {pendingAppointments.length === 0 && (
                                <div className="p-4 text-sm text-gray-500">
                                    No upcoming X-Ray
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
                            <Link href="/radtech/appointments">
                                <button className="w-full rounded-xl bg-moss-500 p-4 font-bold text-white transition hover:bg-moss-700">
                                    Start X-Ray
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

RadTechDashboard.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
