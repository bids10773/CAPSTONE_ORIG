import { Head, Link, usePage } from '@inertiajs/react';
import { Calendar, HeartPulse, Users, ClipboardList } from 'lucide-react';
import { OnsiteOverviewCard } from '@/components/onsite-overview-card';
import type { OnsiteOverview } from '@/components/onsite-overview-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Doctor Dashboard', href: '' }];

interface Appointment {
    id: number;
    appointment_date: string;
    status: string;
    service_types: string;
    user: {
        first_name: string;
        last_name: string;
    };
}

interface Props {
    pendingCount: number;
    todayCount: number;
    totalPatients: number;
    completedPhysicalCount: number;
    onsiteSummary: OnsiteOverview;
    upcomingAppointments: Appointment[]; // 👈 ADD
}

export default function DoctorDashboard(props: Props) {
    const { auth } = usePage().props as any;
    const {
        pendingCount,
        todayCount,
        completedPhysicalCount,
        onsiteSummary,
        upcomingAppointments,
    } = props;

    // Get availability days from authenticated doctor
    const availabilityDays = auth?.user?.availability?.length || 0;

    return (
        <>
            <Head title="Doctor Dashboard" />

            <div className="min-h-screen space-y-6 bg-gray-50 p-6">
                {/* HEADER */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Welcome,{' '}
                        <span className="text-moss-600">
                            Dr. {auth?.user?.name}
                        </span>
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Here is your medical practice overview for today.
                    </p>
                </div>

                {/* STATS (CLINIC STYLE BUT YOUR DATA) */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Today Patients */}
                    <div className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-xl hover:shadow-moss-500/5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-moss-50 text-moss-600">
                            <Users size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                            Today's Patients
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                            {todayCount}
                        </p>
                    </div>

                    {/* Pending */}
                    <div className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-xl hover:shadow-moss-500/5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <HeartPulse size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                            Pending Consultations
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                            {pendingCount}
                        </p>
                    </div>

                    {/* Completed Physical Exams */}
                    <div className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-xl hover:shadow-moss-500/5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                            <ClipboardList size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                            Completed Physical Exams
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                            {completedPhysicalCount}
                        </p>
                    </div>

                    {/* Availability */}
                    <div className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-xl hover:shadow-moss-500/5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                            <Calendar size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                            Available Days
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                            {availabilityDays}
                        </p>
                    </div>
                </div>

                <OnsiteOverviewCard
                    summary={onsiteSummary}
                    href="/doctor/onsite-events"
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
                                href="/doctor/appointments"
                                className="text-sm font-bold text-moss-600 hover:underline"
                            >
                                View All
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {upcomingAppointments.length > 0 ? (
                                upcomingAppointments.map((apt) => (
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
                                                <div className="flex flex-wrap gap-1">
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
                                            <p className="font-bold text-gray-900">
                                                {new Date(
                                                    apt.appointment_date,
                                                ).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>

                                            <span
                                                className={`rounded-full px-2 py-1 text-xs ${
                                                    apt.status === 'accepted'
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : 'bg-moss-100 text-moss-700'
                                                }`}
                                            >
                                                {apt.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl bg-gray-50/50 p-4 text-sm text-gray-500">
                                    No upcoming appointments
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
                            <Link href="/doctor/appointments">
                                <button className="flex w-full items-center gap-3 rounded-xl bg-moss-500 p-4 font-bold text-white transition hover:bg-moss-700">
                                    <HeartPulse className="h-5 w-5" />
                                    Start Consultation
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

DoctorDashboard.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
