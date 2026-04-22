import { Head, Link, usePage } from '@inertiajs/react';
import { Calendar, HeartPulse, Users, Activity, ClipboardList} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Doctor Dashboard', href: "" },
];

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
    upcomingAppointments: Appointment[]; // 👈 ADD
}

export default function DoctorDashboard(props: Props) {
    const { auth } = usePage().props as any;
    const { pendingCount, todayCount, completedPhysicalCount, upcomingAppointments} = props;
    console.log(upcomingAppointments);

    // Get availability days from authenticated doctor
    const availabilityDays = auth?.user?.availability?.length || 0;

   return (
    <>
        <Head title="Doctor Dashboard" />

        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    Welcome, <span className="text-[#246AFE]">Dr. {auth?.user?.name}</span>
                </h1>
                <p className="text-gray-500 mt-1">
                    Here is your medical practice overview for today.
                </p>
            </div>

            {/* STATS (CLINIC STYLE BUT YOUR DATA) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* Today Patients */}
                <div className="bg-white/60 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <Users size={24} />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Today's Patients</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{todayCount}</p>
                </div>

                {/* Pending */}
                <div className="bg-white/60 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                        <HeartPulse size={24} />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Pending Consultations</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{pendingCount}</p>
                </div>

                {/* Completed Physical Exams */}
                <div className="bg-white/60 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                        <ClipboardList size={24} />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Completed Physical Exams</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{completedPhysicalCount}</p>
                </div>

                {/* Availability */}
                <div className="bg-white/60 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                        <Calendar size={24} />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Available Days</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{availabilityDays}</p>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* UPCOMING */}
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-md border border-white rounded-[2rem] p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-gray-900">Upcoming Appointments</h2>
                        <Link href="/doctor/appointments" className="text-sm font-bold text-[#246AFE] hover:underline">
                            View All
                        </Link>
                    </div>

                    <div className="space-y-4">
    {upcomingAppointments.length > 0 ? (
        upcomingAppointments.map((apt) => (
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
                        <div className="flex flex-wrap gap-1">
    {(() => {
        try {
            const parsed = typeof apt.service_types === 'string'
                ? JSON.parse(apt.service_types)
                : apt.service_types;

            return Array.isArray(parsed)
                ? parsed.map((s: string, i: number) => (
                    <span
                        key={i}
                        className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                    >
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
                    <p className="font-bold text-gray-900">
                        {new Date(apt.appointment_date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>

                    <span
                        className={`text-xs px-2 py-1 rounded-full ${
                            apt.status === 'accepted'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}
                    >
                        {apt.status}
                    </span>
                </div>
            </div>
        ))
    ) : (
        <div className="p-4 bg-gray-50/50 rounded-xl text-gray-500 text-sm">
            No upcoming appointments
        </div>
    )}
</div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="bg-white/60 backdrop-blur-md border border-white rounded-[2rem] p-6 shadow-sm">
                    <h2 className="text-xl font-black text-gray-900 mb-6">Quick Actions</h2>

                    <div className="space-y-3">
                        <Link href="/doctor/appointments">
                            <button className="w-full flex items-center gap-3 p-4 bg-[#246AFE] text-white rounded-xl font-bold hover:bg-blue-700 transition">
                                <HeartPulse className="w-5 h-5" />
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

DoctorDashboard.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;